export function build(elementDesc, parent = null, prepend = false) {
	const [tag, ...class_list] = elementDesc.split(".");
	const element = document.createElement(tag);
	if (class_list.length) element.classList.add(...class_list);

	if (parent)
		prepend ? parent.prepend(element) : parent.append(element);
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
	// There's currently seems to be a bug with telegram Windows client
	// preventing to invoke `callback` parameter and onEvent("popupClosed" ...)
	// when user closes the popup with ESC button or X button.
	// So the promise won't resolve in this case

	return new Promise(resolve => {
		window.Telegram.WebApp.showConfirm(message, resolve);
	});
}

export function buildButton(classes, text, parent = null, onClick = null) {
	const button = build(`button${classes || ""}`, parent);
	const contentElement = build("div.buttonContent", button);
	build("div.rippleJS", button);

	contentElement.textContent = text || "";
	if (onClick) button.addEventListener("click", onClick);
	return button;
}

export function buildCheckbox(classes, name, parent = null) {
	let labelDesc = "label.tgCheckbox";
	if (classes) labelDesc += `.${classes}`;

	const label = build(labelDesc, parent);
	const checkboxElement = build("input", label);
	checkboxElement.type = "checkbox";
	checkboxElement.name = name;
	const visualizerElement = build("div.visualizer", label);

	return [label, checkboxElement];
}

export function isTouchDevice() {
	return ("ontouchstart" in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0);
}

export function hexToRGBA(hex, alpha) {
	const r = parseInt(hex.slice(1, 3), 16);
	const g = parseInt(hex.slice(3, 5), 16);
	const b = parseInt(hex.slice(5, 7), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function doMounted(element, callback) {
	// temporarily adds DOM element to the document tree and executes a
	// callback. Useful for interacting with DOM properties that is not
	// addessible when element isn't mounted

	const prevParent = element.parentNode;
	const prevSibling = element.previousSibling;

	element.remove();

	const tmpContainer = build("div", document.body);
	tmpContainer.style.position = "fixed";
	tmpContainer.style.width = "100vw";
	tmpContainer.style.top = "0";
	tmpContainer.style.left = "100vw";
	tmpContainer.append(element);

	callback(element);

	if (prevParent) {
		prevSibling ?
			prevParent.insertBefore(element, prevSibling.nextSibling) :
			prevParent.insertBefore(element, prevParent.firstChild);
	}

	tmpContainer.remove();
}