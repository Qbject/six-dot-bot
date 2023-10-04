import { build } from "./util.js";

export default class Block {
    // abstract class for all block types to extend
    constructor(props) {
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
        this.buildContent();
        this.buildSettings();
    }

    buildContent() {
        // intended for subclesses to extend
        this.blockElement = build("div.block");
    }

    buildSettings() {
        // intended for subclesses to extend
        this.settingsElement = build("div.settings");
    }

    applySettings() {
        const readResult = this.readSettings();
        if (readResult === false) return false;

        const prevBlockElement = this.blockElement;
        this.buildContent();
        prevBlockElement.replaceWith(this.blockElement);

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
}
