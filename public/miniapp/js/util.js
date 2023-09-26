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