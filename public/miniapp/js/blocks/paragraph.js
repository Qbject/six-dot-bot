import { build } from "../util.js";

const defaultProps = {
    text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
}

export default class ParagraphBlock {
    static name = "Paragraph";
    static typeName = "paragraph";

    constructor(props = null) {
        this.props = props || defaultProps;
        this.editMode = false;
        this.blockElement = null;
    }

    setup() {
        this.build();
    }

    build() {
        this.blockElement = build("div.block");
        this.contentElement = build("div.content", this.blockElement);
        this.settingsElement = build("div.settings", this.blockElement);

        this.paragraphElement = build("p", this.contentElement);
        this.paragraphElement.textContent = this.props.text;
    }

    enterEditMode() {
        this.editMode = true;
        this.blockElement.classList.add("editing");
    }

    exitEditMode() {
        this.editMode = false;
        this.blockElement.classList.remove("editing");
    }
}