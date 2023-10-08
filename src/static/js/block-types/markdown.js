import Block from "../block.js";
import { build, buildCheckbox } from "../util.js";

export default class MarkdownBlock extends Block {
	static name = "Markdown Section";
	static typeName = "markdown";

	getDefaultProps() {
		return {
			text: "Markdown is a *lightweight* markup language that you can use to add formatting elements to **plain text documents**. This section provides you the full power of markdown."
		}
	}

	buildContent() {
		this.blockElement.classList.add("markdown");
	}

	buildSettings() {
		this.textInput = build("textarea", this.settingsElement);
		this.textInput.value = this.props.text;
	}

	async readSettings() {
		const text = this.textInput.value.trim();
		if (!text) {
			window.Telegram.WebApp.showAlert("Text can't be empty");
			return false;
		}

		return { text }
	}

	async applyProps(props) {
		this.props = props;

		// parsing markdown to html
		const rawHTML = marked.parse(this.props.text);
		// sanitizing resulting html
		const sanitizedHTML = DOMPurify.sanitize(rawHTML);
		this.blockElement.innerHTML = sanitizedHTML;

		this.postProcessTaskLists()
		this.highlightCode()
	}

	async postProcessTaskLists() {
		const query = "ul>li>input[type='checkbox']";
		const search = this.blockElement.querySelectorAll(query);

		for (const taskCheckbox of search) {
			const listElement = taskCheckbox.parentElement.parentElement;
			listElement.classList.add("taskList");

			// creating custom checkbox to add styling
			const [labelElement, checkboxElement] = buildCheckbox(
				"disabled", "taskListMarker");
			checkboxElement.disabled = true;
			checkboxElement.checked = taskCheckbox.checked;
			taskCheckbox.replaceWith(labelElement);
		}
	}

	highlightCode() {
		const codeElements = this.blockElement.querySelectorAll("pre>code");
		for (const codeElement of codeElements) {
			hljs.highlightElement(codeElement);
		}
	}
}