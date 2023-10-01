import { callAPI, sleep } from "./util.js";
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
    }

    setup() {
        this.build();

        window.Telegram.WebApp.BackButton.onClick(() => this.goBack());

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
        const page = new ConstructorPage(JSON.parse(pageData.schema),
            pageData.id, true);
        return [pageData, page];
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
        if (pageId) {
            const pageResp = await callAPI("GET", `pages/${pageId}`);
            const [_, page] = await this.constructPageFromResp(pageResp);
            this.router.pushPage(page, appearInstantly);
            return;
        }

        const userPagesResp = await callAPI("GET", "pages/my");
        const userPages = (await userPagesResp.json()).pages;
        const page = new HomePage(userPages);
        this.router.pushPage(page, appearInstantly);
        this.connectHomePage(page);

        if (!userPages.length) {
            console.log("AAAA")
            // if user got 0 pages, automatically showing the onboarding page
            this.createNewPage(true, true);
        }
    }

    async createNewPage(onboarding = false, appearInstantly = false) {
        const pageResp = await callAPI("POST", "pages", { onboarding });
        const [pageData, page] = await this.constructPageFromResp(pageResp);
        this.router.pushPage(page, appearInstantly);

        // rendering item behind the scenes after the new page appear animated
        await sleep(200);
        this.homePage.addNewPage(pageData);
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