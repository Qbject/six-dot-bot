// TODO: docstring

export function build(node_desc, parent = null) {
    const [tag, ...class_list] = node_desc.split(".");
    const element = document.createElement(tag);
    if (class_list.length) element.classList.add(...class_list);
    parent && parent.append(element);
    return element;
}

export async function callAPI(method, endpoint, payload) {
    const params = {
        method,
        headers: {
            "X-Tg-Init-Data": window.Telegram.WebApp.initData
        }
    }

    if (method == "POST") {
        params.headers["Content-Type"] = "application/json";
        params.body = JSON.stringify(payload);
    }

    return await fetch(`/api/${endpoint}`, params);
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function switchActiveChild(parentElement, childSelector) {
    // adds class "active" to the child by given selector
    // ensures only one child is active

    const activeChildren = parentElement.querySelectorAll(":scope>.active");
    for (const element of activeChildren)
        element.classList.remove("active");

    let targetChild = null;
    if (childSelector) {
        targetChild = parentElement.querySelector(childSelector);
        targetChild?.classList?.add?.("active");
    }

    return !!targetChild;
}

export function removeArrayItem(array, item) {
    const index = array.indexOf(item);

    if (index > -1) {
        array.splice(index, 1);
    }

    return index != -1;
}

export function tgConfirm(message) {
    return new Promise(resolve => {
        window.Telegram.WebApp.showConfirm(message, resolve);
    });
}

export function buildButton(classes, text, parent = null, onClick = null) {
    // TODO: documentation/explanation
    const button = build(`button${classes || ""}`, parent);
    const contentElement = build("div.buttonContent", button);
    build("div.rippleJS", button);

    contentElement.textContent = text || "";
    if (onClick) button.addEventListener("click", onClick);
    return button;
}