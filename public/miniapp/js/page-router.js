import { build, removeArrayItem } from "./util.js";

export default class PageRouter {
    constructor() {
        this.activePage = null;
        this.pagesStack = [];
        this.callbacks = {};
    }

    build() {
        this.pagesContainer = build("div.pages");
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