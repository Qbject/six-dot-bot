// TODO: docstring

export function build(node_desc, parent = null) {
    const [tag, ...class_list] = node_desc.split(".");
    const element = document.createElement(tag);
    if (class_list.length) element.classList.add(...class_list);
    parent && parent.append(element);
    return element;
}

// TODO: use .block!
export function insertChildAtIndex(parent, child, insertIndex) {
    const referenceElement = parent.children[insertIndex];

    if (referenceElement) {
        parent.insertBefore(child, referenceElement);
    } else {
        parent.append(child);
    }
}