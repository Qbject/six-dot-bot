import Block from "../block.js";
import { build } from "../util.js";

export default class MarkdownBlock extends Block {
	static name = "Markdown Block";
	static typeName = "markdown";

	getDefaultProps() {
		return {
			text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
		}
	}

	buildContent() {
		this.blockElement.classList.add("markdown");
	}

	buildSettings() {
		this.textInput = build("textarea", this.settingsElement);
		this.textInput.value = this.props.text;
	}

	readSettings() {
		const text = this.textInput.value.trim();
		if (!text) {
			window.Telegram.WebApp.showAlert("Text can't be empty");
			return false;
		}

		return { text }
	}

	applyProps(props) {
		this.props = props;
		
		// parsing markdown to html
		const rawHTML = marked.parse(this.props.text);
		// sanitizing resulting html
		const sanitizedHTML = DOMPurify.sanitize(rawHTML);
		this.blockElement.innerHTML = sanitizedHTML;
	}
}