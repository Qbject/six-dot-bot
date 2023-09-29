import { blockRegistry } from "./block-registry.js";
import { build, callAPI, removeArrayItem, tgConfirm } from "./util.js";
import config from "./config.js";

export class ConstructorPage {
    constructor(schema, id, editable) {
        this.schema = schema;
        this.id = id;
        this.editable = editable;
        this.allBlocks = [];
        this.editingBlock = null;
    }

    setup() {
        this.build();

        if (this.editable) {
            this.setupDragNDrop();

            this.pageElement.addEventListener("click", event => {
                const blockElement = event.target.closest(".block");
                if (!blockElement) return;
                const block = this.getBlockObject(blockElement);

                if (!this.editingBlock) {
                    this.editingBlock = block;
                    block.enterEditMode();
                    event.preventDefault();
                    event.stopPropagation();
                } else {
                    if (this.editingBlock != block) {
                        this.editingBlock.exitEditMode();
                        this.editingBlock = null;
                        event.preventDefault();
                        event.stopPropagation();
                    }
                }
            })
        }
    }

    build() {
        this.pageElement = build("div.page");
        this.contentElement = build("div.content", this.pageElement);
        this.blocksContainer = build("div.blocksContainer",
            this.contentElement);
        this.applySchema(this.schema);
    }

    setupDragNDrop() {
        new Sortable(this.blocksContainer, {
            group: {
                name: "editablePage"
            },
            animation: 150,
            onAdd: event => {
                const blockTypeName = event.item.dataset.typeName;
                const blockClass = blockRegistry.getType(blockTypeName);
                const block = new blockClass();
                block.setup();
                this.allBlocks.push(block);
                event.item.replaceWith(block.blockElement);
            }
        });
    }

    getBlockObject(blockElement) {
        return this.allBlocks.find(block =>
            block.blockElement == blockElement);
    }

    async save() {
        // saves page to the database on the server
        await callAPI("POST", `pages/${this.id}`, {
            schema: JSON.stringify(this.readSchema()),
            title: this.getTitle()
        })
    }

    applySchema(schema) {
        // building DOM according to given page schema

        const fillContainer = (blockList, container) => {
            container.innerHTML = "";

            for (const blockSchema of blockList) {
                const blockClass = blockRegistry.getType(blockSchema.typeName);
                const block = new blockClass(blockSchema.props);
                this.allBlocks.push(block);

                block.setup();
                container.append(block.blockElement);

                if (block.childrenElement)
                    fillContainer(blockSchema.children, block.childrenElement);
            }
        }

        fillContainer(schema.children, this.blocksContainer);
    }

    readSchema() {
        // traversing blocks hierarchy to construct page schema

        const readBlockSchema = (block) => {
            const blockSchema = {
                typeName: block.constructor.typeName,
                props: block.props,
                children: block.childrenElement ?
                    traverseContainer(block.childrenElement) : null
            }
            return blockSchema;
        }

        const readContainerSchema = (containerElement) => {
            const containerBlocks = [];

            for (const blockElement of containerElement.children) {
                const block = this.getBlockObject(blockElement);
                const blockSchema = readBlockSchema(block);
                containerBlocks.push(blockSchema);
            }
            return containerBlocks;
        }

        return {
            "children": readContainerSchema(this.blocksContainer)
        };
    }

    getTitle() {
        // getting title from a first heding on the page

        const heading = this.pageElement.querySelector("h1");
        return heading?.textContent || "";
    }

    getLink() {
        return `https://t.me/${config.bot_username}/${config.bot_appname}`
            + `?startapp=${this.id}`
    }
}

export class HomePage {
    constructor(userPages) {
        this.userPages = userPages;
        this.selectMode = false;
        this.selectedPages = [];
        this.callbacks = {};
    }

    addCallback(eventName, callback) {
        if (!(eventName in this.callbacks)) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    removeCallback(eventName, callback) {
        if (eventName in this.callbacks) {
            removeArrayItem(this.callbacks[eventName], callback);
        }
    }

    triggerEvent(eventName, params = []) {
        for (const callback of this.callbacks[eventName] || []) {
            callback(...params);
        }
    }

    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.home");
        this.contentElement = build("div.content", this.pageElement);
        this.pagesList = build("ul.pages", this.contentElement);
        this.pagesList.dataset.longPressDelay = "500";

        for (const pageData of this.userPages) {
            this.pagesList.append(this.buildPageItem(pageData));
        }

        this.pagesList.addEventListener("click", event => {
            const itemElement = event.target.closest(".pageItem");
            if (!itemElement) return;
            const selecting = !!event.target.closest(".selectIndicator");

            this.onItemInteraction(itemElement.dataset.pageId, selecting);
        });
        this.pagesList.addEventListener("long-press", event => {
            const itemElement = event.target.closest(".pageItem");
            if (!itemElement) return;
            event.preventDefault();

            this.onItemInteraction(itemElement.dataset.pageId, true);
        });
    }

    buildPageItem(pageData) {
        const itemElement = build("li.pageItem");
        itemElement.dataset.pageId = pageData.id;

        const selectIndicator = build("div.selectIndicator", itemElement);
        const contentElement = build("div.name", itemElement)

        if (pageData.title) {
            contentElement.textContent = pageData.title;
        } else {
            contentElement.classList.add("unnamed");
            contentElement.textContent = "Unnamed";
        }

        return itemElement;
    }

    onPageDelete() {
        for (const pageItem of this.pagesList.children) {
            const itemDeleted = !this.userPages.find(pageData =>
                pageData.id == pageItem.pageId)
            if (itemDeleted) pageItem.classList.add("deleted");
        }
    }

    onItemInteraction(pageId, selecting) {
        if (this.selectMode || selecting) {
            if (this.selectedPages.includes(pageId)) {
                removeArrayItem(this.selectedPages, pageId);
            } else {
                this.selectedPages.push(pageId);
            }
            this.updateSelectedPages();
            return;
        }

        this.triggerEvent("pageOpen", [pageId]);
    }

    updateSelectedPages() {
        this.selectMode = !!this.selectedPages.length;
        this.triggerEvent("selectionChange");

        for (const itemElement of this.pagesList.children) {
            itemElement.classList.toggle("selected",
                this.selectedPages.includes(itemElement.dataset.pageId));
        }
    }

    async deleteSelectedPages() {
        // TODO: animate

        const delCount = this.selectedPages.length;
        const confirmMessage = `Are you sure you want to delete ${delCount} ` +
            `message${delCount - 1 ? "s" : ""}?`;
        const confirmed = await tgConfirm(confirmMessage);
        if (!confirmed) return;

        for (const pageId of this.selectedPages) {
            await callAPI("DELETE", `pages/${pageId}`)
        }

        this.selectedPages = [];
        this.updateSelectedPages();
    }
}

export class NotFoundPage {
    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.notFound");
        this.contentElement = build("div.content", this.pageElement);
        this.contentElement.textContent = "Page not found";
    }
}

export class ErrorPage {
    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.error");
        this.contentElement = build("div.content", this.pageElement);
        this.contentElement.textContent = "Error";
    }
}