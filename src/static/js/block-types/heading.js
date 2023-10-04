import Block from "../block.js";
import { build } from "../util.js";

export default class HeadingBlock extends Block {
    static name = "Main heading";
    static typeName = "heading";

    getDefaultProps() {
        return {
            text: "Page title"
        }
    }

    buildContent() {
        super.buildContent();
        const headingElement = build("h1", this.blockElement);
        headingElement.textContent = this.props.text;
    }

    buildSettings() {
        super.buildSettings();
        this.textInput = build("input.tgInput", this.settingsElement);
        this.textInput.value = this.props.text;
    }

    readSettings() {
        const text = this.textInput.value.trim();
        if (!text) return false;
        
        this.props = { text }
    }
}