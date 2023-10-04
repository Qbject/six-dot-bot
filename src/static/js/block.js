import { build } from "./util.js";

export default class Block {
    // abstract class for all block types to extend
    constructor(props) {
        this.props = props;
        this.blockElement = null;
        this.settingsElement = null;
    }

    setup() {
        this.build();
    }

    build() {
        this.buildContent();
        this.buildSettings();
    }

    buildContent() {
        this.blockElement = build("div.block");
    }

    buildSettings() {
        this.settingsElement = build("div.settings");
    }

    applySettings() {
        throw new Error("Subclasses must implement applySettings.");
    }
}
