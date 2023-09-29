import { blockRegistry } from "./block-registry.js";
import { build, sleep, switchActiveChild } from "./util.js";

export class ControlPanel {
    constructor(app) {
        this.app = app;
        this.activeMode = null;
        this.activeMenu = null;
    }

    setMode(modeName) {
        if (this.activeMode === modeName) return;

        this.activeMode = modeName;
        this.panelElement.classList.toggle("active", this.activeMode);

        switchActiveChild(this.modesContainer, this.activeMode ?
            `:scope>.${this.activeMode}Mode` : null);
    }

    toggleMenu(menuName = null) {
        if (this.activeMenu === menuName)
            this.activeMenu = null;
        else
            this.activeMenu = menuName;


        this.menusContainer.classList.toggle("active", this.activeMenu);
        switchActiveChild(this.menusContainer, this.activeMenu ?
            `:scope>.${this.activeMenu}` : null);
    }

    build() {
        this.panelElement = build("div.controlPanel");
        this.buildMenus();
        this.buildModes();
    }

    buildModes() {
        this.modesContainer = build("div.modes", this.panelElement);

        //  home mode
        const homeModeElement = build("div.homeMode", this.modesContainer);

        const newPageButton = build("button.newPage", homeModeElement);
        newPageButton.textContent = "New Page";
        newPageButton.addEventListener("click", async () => {
            newPageButton.disabled = true;
            await this.app.createNewPage();
            newPageButton.disabled = false;
        });

        // page mode
        const pageModeElement = build("div.pageMode", this.modesContainer);

        const pageMenuButton = build("button.pageMenu", pageModeElement);
        pageMenuButton.textContent = "Page Menu";
        pageMenuButton.addEventListener("click", () =>
            this.toggleMenu("pageMenu"));

        const newBlockButton = build("button.newBlock", pageModeElement);
        newBlockButton.textContent = "New Block";
        newBlockButton.addEventListener("click", () =>
            this.toggleMenu("blockCatalog"));

        // drag mode
        const dragModeElement = build("div.dragMode", this.modesContainer);
        const deleteAreaElement = build("div.deleteArea", dragModeElement);
        const blockDeleteIcon = build("span.icon", dragModeElement);

        this.blockDeleteSortable = new Sortable(deleteAreaElement, {
            group: "editablePage",
            onAdd: event => event.item.remove()
        });

        // pageList mode
        const pageListModeElement = build("div.pageListMode",
            this.modesContainer);

        const deletePageButton = build("button.deletePage",
            pageListModeElement);
        deletePageButton.textContent = "Delete Selected";
        deletePageButton.addEventListener("click", async () => {
            deletePageButton.disabled = true;
            await this.app.homePage.deleteSelectedPages();
            deletePageButton.disabled = false;
        });
    }

    buildMenus() {
        this.menusContainer = build("div.menus", this.panelElement);
        this.buildBlockCatalog();
        this.buildPageMenu();

        this.menusContainer.addEventListener("click", event => {
            if (event.target === this.menusContainer) {
                this.toggleMenu(null);
            }
        })
    }

    buildBlockCatalog() {
        const blockCatalogElement = build("div.menu.blockCatalog",
            this.menusContainer);
        for (const [typeName, blockClass] of blockRegistry.getAllTypes()) {
            // block objects are needed only to produce elements
            // and can be disposed afterwards
            const block = new blockClass();
            block.setup();
            block.blockElement.dataset.typeName = typeName;
            blockCatalogElement.append(block.blockElement);
        }

        this.blockCatalogSortable = new Sortable(blockCatalogElement, {
            group: {
                name: "editablePage",
                pull: "clone",
                put: false
            },
            animation: 150,
            onStart: () => this.toggleMenu("blockCatalog"),
        });
    }

    buildPageMenu() {
        const menuElement = build("div.menu.pageMenu", this.menusContainer);

        const addButton = (className, text, onClick) => {
            const buttonElement = build(`button.${className}`, menuElement);
            buttonElement.textContent = text;
            buttonElement.addEventListener("click", onClick);
            return buttonElement;
        }

        const savePageButton = addButton("savePage", "Save", async () => {
            await this.app.router.activePage.save()
            this.showButtonSplash(savePageButton, "Saved", "lime");
        });
        const sharePageButton = addButton("sharePage", "Share", () =>
            this.app.router.activePage.share());
        const copyLinkButton = addButton("copyLink", "Copy Link", async () => {
            const pageLink = this.app.router.activePage.getLink();

            navigator.clipboard.writeText(pageLink)
                .then(() => this.showButtonSplash(
                    copyLinkButton, "Copied!", "lime"))
                .catch(() => this.showButtonSplash(
                    copyLinkButton, "Unable", "red"));
        });
    }


    async showButtonSplash(buttonElement, text, color = "transparent") {
        // shows button click feedback text
        const splashElement = build("div.actionSplash", buttonElement);
        splashElement.style.borderColor = color;
        splashElement.textContent = text;
        await sleep(800);
        splashElement.remove();
    }
}