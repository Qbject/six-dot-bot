import EventEmitter from "./event-emitter.js";
import { build } from "./util.js";

export default class PageRouter extends EventEmitter {
    constructor() {
        super();
        this.activePage = null;
        this.pagesStack = [];
    }

    build() {
        this.pagesContainer = build("div.pages");
    }

    pushPage(page, appearInstantly) {
        // removing pages that follows the active page
        this.pagesContainer.querySelectorAll(":scope>.active~.page")
            .forEach(pageElement => pageElement.remove());

        // rendering and showing the new page
        page.setup();
        this.pagesContainer.append(page.pageElement);
        if (appearInstantly)
            page.pageElement.classList.add("appearInstantly");

        this.pagesStack.push(page);
        this.updateStack();
    }

    popPage() {
        this.pagesStack.pop();
        this.updateStack();
    }

    updateStack() {
        this.activePage?.pageElement?.classList?.remove("active");
        this.activePage = this.pagesStack[this.pagesStack.length - 1];
        this.activePage.pageElement.classList.add("active");

        this.triggerEvent("pageChange")
    }
}