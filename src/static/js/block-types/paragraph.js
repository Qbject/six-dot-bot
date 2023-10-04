import Block from "../block.js";
import { build } from "../util.js";

export default class ParagraphBlock extends Block {
    static name = "Paragraph";
    static typeName = "paragraph";

    getDefaultProps() {
        return {
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
        }
    }

    buildContent() {
        super.buildContent();
        const paragraphElement = build("p", this.blockElement);
        paragraphElement.textContent = this.props.text;
    }

    buildSettings() {
        super.buildSettings();
        this.textInput = build("textarea.tgTextarea", this.settingsElement);
        this.textInput.value = this.props.text;
    }

    readSettings() {
        const text = this.textInput.value.trim();
        if (!text) return false;

        this.props = { text }
    }

}