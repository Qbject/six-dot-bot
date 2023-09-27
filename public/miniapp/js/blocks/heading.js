import { build } from "../util.js";

const defaultProps = {
    text: "Page title"
}

export default class HeadingBlock {
    static name = "Main heading";
    static typeName = "heading";

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

        this.headingElement = build("h1", this.contentElement);
        this.headingElement.textContent = this.props.text;
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