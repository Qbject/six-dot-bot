import Block from "../block.js";
import { build } from "../util.js";

export default class GridBlock extends Block {
	static name = "Grid";
	static typeName = "grid";

	getDefaultProps() {
		return {
			columnsCount: 2,
		}
	}

	buildContent() {
		this.blockElement.classList.add("grid");

		this.childrenContainer = build("div.grid.blocksContainer",
			this.blockElement);
	}

	buildSettings() {
		this.settingsElement.classList.add("grid");

		const countSection = build("div.countSection", this.settingsElement);
		const countHintElement = build("span", countSection);
		countHintElement.textContent = "Number of columns";

		this.countInput = build("input", countSection);
		this.countInput.type = "number";
		this.countInput.value = this.props.columnsCount;

		build("hr", this.settingsElement);
	}

	async readSettings() {
		const columnsCount = +this.countInput.value.trim();
		if (columnsCount < 2 || columnsCount > 6) {
			window.Telegram.WebApp.showAlert(
				"Grid should have 2-6 columns");
			return false;
		}

		return { columnsCount }
	}

	async applyProps(props) {
		this.props = props;
		const columnsCss = `repeat(${this.props.columnsCount}, 1fr)`;
		this.childrenContainer.style.gridTemplateColumns = columnsCss;
	}
}