import Block from "../block.js";
import { build } from "../util.js";

const defaultProps = {
    text: "Page title"
}

export default class HeadingBlock extends Block {
    static name = "Main heading";
    static typeName = "heading";

    constructor(props) {
        super(props || defaultProps);
    }

    buildContent(contentWrapper) {
        const headingElement = build("h1", contentWrapper);
        headingElement.textContent = this.props.text;
    }

    buildSettings(settingsWrapper) {
        settingsWrapper.textContent = "You just opened settings";
    }
}