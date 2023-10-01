import { callAPI } from "./util.js";
import { ConstructorPage, HomePage, NotFoundPage, ErrorPage } from "./pages.js";
import { ControlPanel } from "./control-panel.js";
import PageRouter from "./page-router.js";

// TODO: DOCSTRINGS
// TODO: better snapping animation?

class App {
    constructor(rootElement) {
        this.rootElement = rootElement;
        this.pagesStack = [];
        this.dragActive = false;

        const { colorScheme } = window.Telegram.WebApp;
        this.rootElement.dataset.colorScheme = colorScheme;

        this.userPages = null;
        this.userPagesPromise = callAPI("GET", "pages/my")
            .then(resp => resp.json())
            .then(data => this.userPages = data.pages);
    }

    setup() {
        this.build();

        this.router.addCallback("pageChange", () => {
            const backBtn = window.Telegram.WebApp.BackButton
            this.router.pagesStack.length > 1 ?
                backBtn.show() : backBtn.hide();

            this.updateControlPanel()
        });

        const handleDrag = event => {
            if (event.type === "dragstart") {
                if (event.target.classList.contains("block")) {
                    this.setDragActive(true);
                }
            } else {
                this.setDragActive(false);
            }
        }

        this.rootElement.addEventListener("dragstart", handleDrag);
        this.rootElement.addEventListener("dragend", handleDrag);
        this.rootElement.addEventListener("drop", handleDrag);
    }

    build() {
        this.controlPanel = new ControlPanel(this);
        this.controlPanel.build();
        this.rootElement.append(this.controlPanel.panelElement);

        this.router = new PageRouter();
        this.router.build();
        this.rootElement.append(this.router.pagesContainer);
    }

    async constructPageFromResp(pageResp) {
        // reusable logic for constructing page based on backend response
        if (pageResp.status == 404) return new NotFoundPage();
        if (!pageResp.ok) return new ErrorPage();

        const pageData = (await pageResp.json()).page;
        return new ConstructorPage(
            JSON.parse(pageData.schema), pageData.id, true)
    }

    connectHomePage(page) {
        // only one home page can be in the stack,
        this.homePage = page;
        this.homePage.addCallback("pageOpen", pageId =>
            this.openPage(pageId));
        this.homePage.addCallback("selectionChange", () =>
            this.updateControlPanel());
    }

    async openPage(pageId, appearInstantly) {
        let page = null

        if (pageId) {
            const pageResp = await callAPI("GET", `pages/${pageId}`);
            page = await this.constructPageFromResp(pageResp);
        } else {
            const userPages = await this.userPagesPromise;

            if (userPages.length) {
                // if user has own pages, showing page list (home page)
                page = new HomePage(this.userPages);
                this.connectHomePage(page);
            } else {
                // if user got no pages, automatically creating and opening
                // new page with onboarding contents
                const pageResp = await callAPI("POST", "pages", {
                    onboarding: true
                });
                page = await this.constructPageFromResp(pageResp);
            }
        }

        this.router.pushPage(page, appearInstantly);
    }

    async createNewPage() {
        const pageResp = await callAPI("POST", "pages");
        const page = await this.constructPageFromResp(pageResp);
        this.router.pushPage(page);

        const userPages = await this.userPagesPromise;
        // TODO
    }

    goBack() {
        if (this.controlPanel.activeMenu) {
            this.controlPanel.toggleMenu(null);
            return;
        }

        this.router.popPage();
    }

    updateControlPanel() {
        let controlPanelMode = null;
        const curPage = this.router.activePage;

        if (curPage.constructor == HomePage) {
            controlPanelMode = curPage.selectMode ? "pageList" : "home";
        } else if (curPage.constructor == ConstructorPage) {
            controlPanelMode = this.dragActive ? "drag" : "page";
        }

        this.controlPanel.setMode(controlPanelMode);
    }

    setDragActive(isActive) {
        this.dragActive = isActive;
        this.updateControlPanel();
    }
}

(function () {
    const appRoot = document.querySelector("#app");

    const pageParams = new URLSearchParams(document.location.search);
    const startPage = pageParams.get("tgWebAppStartParam")

    window.app = new App(appRoot);
    window.app.setup();
    window.app.openPage(startPage, true);
})();