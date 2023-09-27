import { blockRegistry } from "./block-registry.js";
import { build, callAPI } from "./util.js";

// TODO: DOCSTRINGS
// TODO: better snapping animation?

class App {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.activePage = null;
        this.pagesStack = [];

        // blindly trusting initData
        // any user-specific action will be validated on the server
        this.tgData = window.Telegram.WebApp.initDataUnsafe;

        window.Telegram.WebApp.BackButton.onClick(() => this.goBack());

        this.build();
        this.setupDragNDrop();

        this.userPagesPromise = callAPI("GET", "pages/my")
            .then(resp => resp.json())
            .then(data => this.userPages = data.pages);
        this.userPages = null;
    }

    build() {
        this.pagesContainer = build("div.pages", this.rootElement);
        this.buildBlockCatalog();

        this.addBlockButton = build("button.addBlock", this.rootElement);
        this.addBlockButton.textContent = "Add block";
        this.addBlockButton.addEventListener("click", () =>
            this.addBlockCatalog.classList.toggle("active"));

        this.savePageButton = build("button.savePage", this.rootElement);
        this.savePageButton.textContent = "Save page";
        this.savePageButton.addEventListener("click", () =>
            this.activePage.save());

        this.deleteBlockArea = build("div.deleteBlockArea", this.rootElement);
        this.deleteBlockArea.textContent = "Remove Block";
        new Sortable(this.deleteBlockArea, {
            group: "editablePage",
            onAdd: event => event.item.remove()
        });
    }

    buildBlockCatalog() {
        this.addBlockCatalog = build("div.addBlockCatalog", this.rootElement);

        for (const [typeName, blockClass] of blockRegistry.getAllTypes()) {
            // block objects are needed only to produce elements
            // and can be disposed afterwards
            const block = new blockClass();
            block.setup();
            block.blockElement.dataset.typeName = typeName;
            this.addBlockCatalog.append(block.blockElement)
        }
    }

    setupDragNDrop() {
        new Sortable(this.addBlockCatalog, {
            group: {
                name: "editablePage",
                pull: "clone",
                put: false
            },
            animation: 150,
            onStart: () => this.addBlockCatalog.classList.remove("active"),
        });
    }

    async retrievePage(pageId) {
        // TODO: explain everything
        if (!pageId) {
            const userPages = await this.userPagesPromise;
            if (userPages.length) return new HomePage(this);

            const pageResp = await callAPI("POST", "pages", {
                onboarding: true
            });

            if (pageResp.ok) {
                const pageData = (await pageResp.json()).page;
                return new ConstructorPage(JSON.parse(pageData.schema),
                    pageData.id, true, this)
            }

            return new NotFoundPage();
        }

        const pageResp = await callAPI("GET", `pages/${pageId}`);
        if (pageResp.ok) {
            const pageData = (await pageResp.json()).page;
            const isOwn = pageData.ownerId === this.tgData.user.id;
            return new ConstructorPage(JSON.parse(pageData.schema),
                pageData.id, isOwn, this);
        }

        if (pageResp.status == 404) {
            return new NotFoundPage();
        }

        return ErrorPage();
    }

    async openPage(pageId) {
        // removing elements from pages that are already disposed
        const query = `:scope>:not(:nth-child(-n+${this.pagesStack.length}))`;
        const redundantPages = this.pagesContainer.querySelectorAll(query);
        redundantPages.forEach(pageElement => pageElement.remove())

        // rendering and showing the new page
        const newPage = await this.retrievePage(pageId);
        newPage.setup();
        this.pagesContainer.append(newPage.pageElement);

        this.pagesStack.push(newPage);
        this.updateActivePage();
    }

    goBack() {
        this.pagesStack.pop();
        this.updateActivePage();
    }

    updateActivePage() {
        this.activePage?.pageElement?.classList?.remove("active");
        this.activePage = this.pagesStack[this.pagesStack.length - 1];
        this.activePage.pageElement.classList.add("active");

        const backBtn = window.Telegram.WebApp.BackButton
        this.pagesStack.length > 1 ? backBtn.show() : backBtn.hide();
    }

    updateMainButton() {
        const button = window.Telegram.WebApp.MainButton;
        const buttonParams = {
            text: "Add Block",
            is_visible: true
        }

        if (!this.activePage) {
            buttonParams.is_visible = false;
        } else if (this.showingCatalog) {
            buttonParams.text = "Cancel";
        }
        button.setParams(buttonParams);
    }
}

class ConstructorPage {
    constructor(schema, id, editable, app) {
        this.schema = schema;
        this.id = id;
        this.editable = editable;
        this.app = app;
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
        this.blocksContainer = build("div.blocksContainer", this.pageElement);
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
}

class HomePage {
    constructor(app) {
        this.app = app;
    }

    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.home");
        this.pagesList = build("ul.pages", this.pageElement);

        for (const pageData of this.app.userPages) {
            this.pagesList.append(this.buildPageItem(pageData));
        }

        this.pagesList.addEventListener("click", event => {
            const itemElement = event.target.closest(".pageItem");
            if (!itemElement) return;
            this.app.openPage(itemElement.dataset.pageId)
        })
    }

    buildPageItem(pageData) {
        const itemElement = build("li.pageItem");
        itemElement.dataset.pageId = pageData.id;

        if (pageData.title) {
            itemElement.textContent = pageData.title;
        } else {
            itemElement.classList.add("unnamed");
            itemElement.textContent = "Unnamed";
        }

        return itemElement;
    }
}

class NotFoundPage {
    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.notFound");
        this.pageElement.textContent = "Page not found";
    }
}

class ErrorPage {
    setup() {
        this.build();
    }

    build() {
        this.pageElement = build("div.page.error");
        this.pageElement.textContent = "Error";
    }
}

(function () {
    const appRoot = document.querySelector("#app");

    const pageParams = new URLSearchParams(document.location.search);
    const startPage = pageParams.get("tgWebAppStartParam")

    window.app = new App(appRoot, startPage);
    window.app.openPage(startPage);
})();