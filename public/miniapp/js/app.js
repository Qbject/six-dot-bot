import { getAllBlocks, getBlockClassByType } from "./blocks-manager.js";
import { build, callAPI } from "./util.js";

// TODO: DOCSTRINGS
// TODO: better snapping animation?

class App {
    constructor(appRoot, editMode, pageId = null) {
        this.editMode = editMode;
        this.appRoot = appRoot;
        this.activePage = null;
        this.pagesStack = [];
        this.userPagesPromise = callAPI("GET", "pages/my")
            .then(pages => this.userPages = pages);
        this.userPages = null;

        // blindly trusting initData
        // any user-specific action will be validated on the server
        this.tgData = window.Telegram.WebApp.initDataUnsafe;

        this.build();
        this.openPage(pageId);
    }

    build() {
        this.pagesContainer = build("div.pages", this.appRoot);

        this.addBlockCatalog = build("div.addBlockCatalog", this.appRoot);

        const blockClass = getBlockClassByType("card");
        const block = new blockClass({
            "title": "CREATE NEW CARD!",
            "description": "Create new card with some description"
        });
        const blockElement = build("div.block", this.addBlockCatalog);
        block.build(blockElement);

        this.addBlockButton = build("button.addBlock", this.appRoot);
        this.addBlockButton.textContent = "Add block";
        this.addBlockButton.addEventListener("click", () =>
            this.addBlockCatalog.classList.toggle("active"))
    }

    async retrievePage(pageId) {
        if (!pageId) {
            const userPages = await this.userPagesPromise;
            return userPages.length ?
                new HomePage(this) : new WelcomePage(this);
        }

        const pageResp = await callAPI("GET", `pages/${pageId}`);
        if (pageResp.ok) {
            const isOwn = pageData.ownerId === this.tgData.user.id;
            return new Page(pageData.schema, isOwn, this);
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
        newPage.build();
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

class Page {
    constructor(schema, editable, app) {
        this.schema = schema;
        this.editable = editable;
        this.app = app;
        this.blocksMap = {};
    }

    build() {
        this.pageElement = build("div.page.blockContainer");
        this.buildBlockList(this.schema.children, this.pageElement);

        if (this.editable) {
            this.initDragNDrop();

            this.pageElement.addEventListener("click", event => {
                const clickedBlock = event.closest(".block");
                if (!clickedBlock) return;
                this.editBlock(clickedBlock);
            })
        }
    }

    buildBlockList(blockList, container) {
        container.innerHTML = "";

        for (const blockSchema of blockList) {
            const blockClass = getBlockClassByType(blockSchema.typeName);
            const block = new blockClass(blockSchema.props);
            this.blocksMap[blockSchema.id] = block;

            const blockElement = build("div.block", container);
            blockElement.dataset.blockId = blockSchema.id;
            block.build(blockElement);

            const containerQuery = ":scope .blockContainer:not(:scope " +
                ".blockContainer .blockContainer)";
            const nestedContainer = blockElement.querySelector(containerQuery);
            if (nestedContainer) {
                this.buildBlockList(blockSchema.children, nestedContainer);
            }
        }
    }

    initDragNDrop() {
        const sortableOptions = {
            group: {
                name: "editablePage"
            },
            animation: 150
        }

        const containers = this.appRoot.querySelectorAll(".blockContainer");
        for (const container of containers) {
            new Sortable(container, sortableOptions);

        }

        new Sortable(this.addBlockCatalog, {
            group: {
                name: "editablePage",
                pull: "clone",
                put: false
            },
            animation: 150,
            onStart: () => this.addBlockCatalog.classList.remove("active")
        })
    }

    editBlock(blockElement) {

    }
}

class HomePage {
    constructor(app) {
        this.app = app;
    }

    build() {
        this.pageElement = build("div.page.home");
        this.pagesList = build("ul.pages", this.pageElement);

        for (const pageData of this.app.userPages) {
            this.pagesList.append(this.buildPageItem(pageData));
        }
    }

    buildPageItem(pageData) {
        // TODO: <i> for unnamed
        const itemElement = build("li.pageItem");
        itemElement.textContent = pageData.title || "Unnamed";

        return itemElement;
    }
}

class NotFoundPage {
    build() {
        this.pageElement = build("div.page.notFound");
        this.pageElement.textContent = "Page not found";
    }
}

class ErrorPage {
    build() {
        this.pageElement = build("div.page.error");
        this.pageElement.textContent = "Error";
    }
}

class WelcomePage {
    build() {
        this.pageElement = build("div.page.welcome");
        this.pageElement.textContent = "Welcome";
    }
}

(function () {
    const appRoot = document.querySelector("#app");

    const pageParams = new URLSearchParams(document.location.search);
    const startPage = pageParams.get("tgWebAppStartParam")

    window.editor = new App(appRoot, true, startPage); // TODO: read url params
})();