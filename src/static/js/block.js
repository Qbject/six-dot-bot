import { build, buildButton } from "./util.js";

export default class Block {
    // abstract class for all block types to extend
    constructor(props) {
        this.props = props;
        this.editMode = false;
        this.blockElement = null;
    }

    setup() {
        this.build();
    }

    build() {
        this.blockElement = build("div.block");
        const contentElement = build("div.content", this.blockElement);

        const settingsElement = build("div.settings", this.blockElement);
        const settingsAnimator = build("div.animator", settingsElement);
        const settingsBody = build("div.body", settingsAnimator);
        const settingsControls = build("div.controls", settingsAnimator);
        buildButton(".button.discard", "Discard", settingsControls);
        buildButton(".button.apply", "Apply", settingsControls);

        this.buildContent(contentElement);
        this.buildSettings(settingsBody);
    }

    buildContent(contentElement) {
        throw new Error("Subclasses must implement buildContent.");
    }

    buildSettings(settingsBody) {
        throw new Error("Subclasses must implement buildSettings.");
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
