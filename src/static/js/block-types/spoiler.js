import Block from "../block.js";
import { build, buildCheckbox } from "../util.js";

export default class SpoilerBlock extends Block {
	static name = "Spoiler";
	static typeName = "spoiler";

	getDefaultProps() {
		return {
			headText: "Spoiler",
			defaultOpen: false
		}
	}

	buildContent() {
		this.blockElement.classList.add("spoiler");
		this.spoilerElement = build("div.spoiler", this.blockElement);
		
		this.headElement = build("div.summary", this.spoilerElement);
		build("div.rippleJS", this.headElement);
		const iconElement = build("div.icon", this.headElement);
		iconElement.innerHTML = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><g fill='var(--tg-theme-text-color)'><path d='M7.6 5.8c0 .4.1.7.4.9l4.6 4.3c.5.5.5 1.4 0 1.9L8 17.2c-.3.2-.4.6-.4.9 0 1.1 1.3 1.7 2.1.9l6.8-6.2c.6-.5.6-1.4 0-1.9l-6.8-6c-.8-.7-2.1-.1-2.1.9z'></path></g></svg>"
		this.headTitleElement = build("div", this.headElement);
		
		this.bodyElement = build("div.body", this.spoilerElement);
		this.childrenContainer = build("div.blocksContainer",
			this.bodyElement);
	}

	buildSettings() {
		this.settingsElement.classList.add("spoiler");

		const titleElement = build("h2", this.settingsElement);
		titleElement.textContent = "Edit Spoiler";

		const hintElement = build("div.hintAddin", this.settingsElement);
		hintElement.textContent = "You can hide any block under spoiler";

		this.textInput = build("input", this.settingsElement);
		this.textInput.placeholder = "Spoiler Title";
		this.textInput.value = this.props.headText;

		build("hr", this.settingsElement);

		const defaultOpenLabel = build("label.checkboxSection",
			this.settingsElement);
		[, this.defaultOpenCheckbox] = buildCheckbox(null, "defaultOpen",
			defaultOpenLabel);
		this.defaultOpenCheckbox.checked = this.props.defaultOpen;

		const defaultOpenHint = build("span", defaultOpenLabel);
		defaultOpenHint.textContent = "Expand by default";

		build("hr", this.settingsElement);
	}

	async readSettings() {
		const headText = this.textInput.value.trim();
		const defaultOpen = this.defaultOpenCheckbox.checked;

		return { headText, defaultOpen }
	}

	async applyProps(props) {
		this.props = props;

		this.headTitleElement.textContent = this.props.headText;
		this.spoilerElement.dataset.open = this.editMode ||
			this.props.defaultOpen;
	}
}