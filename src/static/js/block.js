import { build } from "./util.js";

export default class Block {
    // abstract class for all block types to extend
    constructor(props, editMode = false, isPreview = false) {
        this.editMode = editMode;
        this.isPreview = isPreview;
        this.props = props || this.getDefaultProps();
        this.blockElement = null;
        this.settingsElement = null;
    }

    getDefaultProps() {
        throw new Error("Subclasses must implement this method.");
    }

    setup() {
        this.build();
    }

    build() {
        this.blockElement = build("div.block");
        this.settingsElement = build("div.settings");

        this.buildContent();
        this.buildSettings();

        this.applyProps();
    }

    buildContent() {
        // intended for subclesses to extend
        this.settingsElement.innerHTML = "";
    }

    buildSettings() {
        // intended for subclesses to extend
        this.settingsElement.innerHTML = "";
    }

    applySettings() {
        const readResult = this.readSettings();
        if (readResult === false) return false;
        this.applyProps();

        // triggering brief block highlight animation after editor close
        this.blockElement.classList.add("justEdited");
        this.blockElement.addEventListener("animationend", event => {
            if (event.animationName == "blockJustEdited")
                this.blockElement.classList.remove("justEdited")
        });
    }

    readSettings() {
        throw new Error("Subclasses must implement this method.");
    }

    // TODO: better naming
    applyProps() {
        throw new Error("Subclasses must implement this method.");
    }
}
