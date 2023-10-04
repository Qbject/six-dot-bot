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

    buildContent() {
        super.buildContent();
        const headingElement = build("h1", this.blockElement);
        headingElement.textContent = this.props.text;
    }

    buildSettings() {
        super.buildSettings();
        this.settingsElement.textContent = "You just opened settings";
    }
}