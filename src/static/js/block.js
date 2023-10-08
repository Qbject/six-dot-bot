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

		this.applyProps(this.props);
	}

	buildContent() {
		throw new Error("Subclasses must implement this method.");
	}

	buildSettings() {
		throw new Error("Subclasses must implement this method.");
	}

	async applySettings() {
		const readResult = await this.readSettings();
		if (readResult === false) return false;
		await this.applyProps(readResult);

		// triggering brief block highlight animation after editor close
		this.blockElement.classList.add("justEdited");
		this.blockElement.addEventListener("animationend", event => {
			if (event.animationName == "blockJustEdited")
				this.blockElement.classList.remove("justEdited")
		});
	}

	async readSettings() {
		// reads values from inputs and updating props
		throw new Error("Subclasses must implement this method.");
	}

	async applyProps(props) {
		// updates block DOM to match object props
		throw new Error("Subclasses must implement this method.");
	}
}
