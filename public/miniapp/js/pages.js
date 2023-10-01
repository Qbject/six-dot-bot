import { blockRegistry } from "./block-registry.js";
import { build, callAPI, removeArrayItem, sleep, tgConfirm } from "./util.js";
import config from "./config.js";
import EventEmitter from "./event-emitter.js";

export class ConstructorPage extends EventEmitter {
    constructor(schema, id, editable) {
        super();
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
                // TODO: comment
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
        this.pageElement = build("div.page.constructor");
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
            },
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

export class HomePage extends EventEmitter {
    constructor(userPages) {
        super();
        this.userPages = userPages;
        this.selectMode = false;
        this.selectedPages = [];
    }

    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.home");
        this.contentElement = build("div.content", this.pageElement);
        this.pageList = build("ul.pageList", this.contentElement);
        this.pageList.dataset.longPressDelay = "500";

        for (const pageData of this.userPages) {
            this.pageList.append(this.buildPageItem(pageData));
        }

        this.pageList.addEventListener("click", event => {
            const itemElement = event.target.closest(".pageItem");
            if (!itemElement) return;
            const selecting = !!event.target.closest(".selectHandle");

            this.onItemInteraction(itemElement.dataset.pageId, selecting);
        });
        this.pageList.addEventListener("long-press", event => {
            const itemElement = event.target.closest(".pageItem");
            if (!itemElement) return;
            event.preventDefault();

            this.onItemInteraction(itemElement.dataset.pageId, true);
        });
    }

    buildPageItem(pageData) {
        const itemElement = build("li.pageItem");
        itemElement.dataset.pageId = pageData.id;

        build("div.background", itemElement);
        const pageInfoElement = build("div.pageInfo", itemElement);
        const pageTitleElement = build("div.pageTitle", pageInfoElement);
        const pageTimeElement = build("div.pageTime", pageInfoElement);
        const selectHandle = build("div.selectHandle", itemElement);
        const selectCheckbox = build("div.checkbox", selectHandle);
        build("div.rippleJS", itemElement);

        pageTitleElement.textContent = pageData.title || "Unnamed";
        if (!pageData.title) pageTitleElement.classList.add("unnamed");
        pageTimeElement.textContent = pageData.modifiedAt;

        return itemElement;
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
        this.pageList.classList.toggle("selectMode", this.selectMode);

        for (const itemElement of this.pageList.children) {
            itemElement.classList.toggle("selected",
                this.selectedPages.includes(itemElement.dataset.pageId));
        }

        this.triggerEvent("selectionChange");
    }

    updatePageitems() {
        // building items for newly added pages
        for (const pageData of this.userPages) {
            const itemSelector = `.pageItem[data-page-id="${pageData.id}"]`;
            const itemElement = this.pageList.querySelector(itemSelector);

            if (!itemElement)
                this.pageList.prepend(this.buildPageItem(pageData));
        }

        // removing releted items for deleted pages (with animation)
        const deletedItems = [];
        for (const pageItem of this.pageList.children) {
            const itemDeleted = !this.userPages.find(pageData =>
                pageData.id == pageItem.dataset.pageId)

            if (itemDeleted) {
                pageItem.classList.add("deleted");
                deletedItems.push(pageItem);
            }
        }
        // deleting from DOM after animation is complete
        return sleep(500).then(() => deletedItems.map(el => el.remove()));
    }

    async deleteSelectedPages() {
        const delCount = this.selectedPages.length;
        const confirmMessage = `Are you sure you want to delete ${delCount} ` +
            `page${delCount - 1 ? "s" : ""}?`;
        const confirmed = await tgConfirm(confirmMessage);
        if (!confirmed) return;

        for (const pageId of this.selectedPages) {
            await callAPI("DELETE", `pages/${pageId}`)
        }
        this.userPages = this.userPages.filter(pageData =>
            !this.selectedPages.includes(pageData.id));

        this.selectedPages = [];
        this.updateSelectedPages();
        this.updatePageitems();
    }

    addNewPage(pageData) {
        this.userPages.unshift(pageData);
        this.updatePageitems();
    }
}

export class NotFoundPage extends EventEmitter {
    constructor() {
        super();
    }

    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.notFound");
        this.contentElement = build("div.content", this.pageElement);
        this.contentElement.textContent = "Page not found";
    }
}

export class ErrorPage extends EventEmitter {
    constructor() {
        super();
    }

    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.error");
        this.contentElement = build("div.content", this.pageElement);
        this.contentElement.textContent = "Error";
    }
}