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

        // blindly trusting initData
        // any user-specific action will be validated on the server
        this.tgData = window.Telegram.WebApp.initDataUnsafe;
        window.Telegram.WebApp.BackButton.onClick(() => this.goBack());

        this.userPages = null;
        this.userPagesPromise = callAPI("GET", "pages/my")
            .then(resp => resp.json())
            .then(data => this.userPages = data.pages);
    }

    build() {
        this.controlPanel = new ControlPanel(this);
        this.controlPanel.build();
        this.rootElement.append(this.controlPanel.panelElement);

        this.router = new PageRouter();
        this.router.build();
        this.rootElement.append(this.router.pagesContainer);

        this.router.addCallback("pageChange", () => {
            const backBtn = window.Telegram.WebApp.BackButton
            this.router.pagesStack.length > 1 ?
                backBtn.show() : backBtn.hide();

            this.updateControlPanel()
        });
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
            controlPanelMode = curPage.dragActive ? "drag" : "page";
        }

        this.controlPanel.setMode(controlPanelMode);
    }
}

(function () {
    const appRoot = document.querySelector("#app");

    const pageParams = new URLSearchParams(document.location.search);
    const startPage = pageParams.get("tgWebAppStartParam")

    window.app = new App(appRoot);
    window.app.build();
    window.app.openPage(startPage, true);
})();