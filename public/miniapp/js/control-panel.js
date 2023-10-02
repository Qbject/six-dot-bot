import { blockRegistry } from "./block-registry.js";
import { build, buildButton, sleep, switchActiveChild } from "./util.js";

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

    setup() {
        this.build();
    }

    build() {
        this.panelElement = build("div.controlPanel");
        this.buildMenus();
        this.buildModes();
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
            await this.app.router.curActivity.save()
            this.showButtonSplash(savePageButton, "Saved", "lime");
        });
        const copyLinkButton = addButton("copyLink", "Copy Link", async () => {
            const pageLink = this.app.router.curActivity.getLink();

            navigator.clipboard.writeText(pageLink)
                .then(() => this.showButtonSplash(
                    copyLinkButton, "Copied!", "lime"))
                .catch(() => this.showButtonSplash(
                    copyLinkButton, "Unable", "red"));
        });
    }

    buildModes() {
        this.modesContainer = build("div.modes", this.panelElement);

        this.setupPageDragMode();
        this.setupPageMode();
        this.setupHomeSelectMode();
        this.setupHomeMode();
    }

    setupHomeMode() {
        const modeElement = build("div.homeMode", this.modesContainer);

        const newPageButton = buildButton(".button.newPage", "New Page",
            modeElement, async () => {
                newPageButton.disabled = true;
                await this.app.createNewPage();
                newPageButton.disabled = false;
            });
    }

    setupPageDragMode() {
        const modeElement = build("div.pageDragMode", this.modesContainer);
        const deleteAreaElement = build("div.deleteArea", modeElement);
        const deleteAnimElement = build("div.animation", deleteAreaElement);
        const receiverElement = build("div.receiver", deleteAreaElement);

        this.blockDeleteAnimation = lottie.loadAnimation({
            container: deleteAnimElement,
            renderer: "svg",
            loop: false,
            autoplay: false,
            path: "/miniapp/lottie/delete.json",
        });

        const handleDragEvent = event => {
            const dragActive = event.type === "dragenter";
            deleteAreaElement.classList.toggle("active", dragActive);
            dragActive ? this.blockDeleteAnimation.goToAndPlay(0, true) :
                this.blockDeleteAnimation.goToAndStop(0, true)
        }

        const eventTypes = ["dragenter", "dragend", "dragleave", "drop"];
        eventTypes.map(eventType =>
            receiverElement.addEventListener(eventType, handleDragEvent));

        this.blockDeleteSortable = new Sortable(receiverElement, {
            group: "editablePage",
            filter: ".animation",
            onAdd: event => event.item.remove()
        });
    }

    setupPageMode() {
        const modeElement = build("div.pageMode", this.modesContainer);

        buildButton(".button.pageMenu", "Page Menu", modeElement, () =>
            this.toggleMenu("pageMenu"));
        buildButton(".button.newBlock", "New Block", modeElement, () =>
            this.toggleMenu("blockCatalog"));
    }

    setupHomeSelectMode() {
        const modeElement = build("div.homeSelectMode", this.modesContainer);

        const deletePageButton = buildButton(".button.danger.deletePage",
            "Delete Selected", modeElement, async () => {
                deletePageButton.disabled = true;
                await this.app.home.deleteSelectedPages();
                deletePageButton.disabled = false;
            });
    }

    // TODO: something
    async showButtonSplash(buttonElement, text, color = "transparent") {
        // shows button click feedback text
        const splashElement = build("div.actionSplash", buttonElement);
        splashElement.style.borderColor = color;
        splashElement.textContent = text;
        await sleep(800);
        splashElement.remove();
    }
}