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
        this.countInput = build("input", this.settingsElement);
        this.countInput.type = "number";
        this.countInput.value = this.props.columnsCount;
    }

    readSettings() {
        const columnsCount = +this.countInput.value.trim();
        if (columnsCount < 2) {
            window.Telegram.WebApp.showAlert(
                "Grid should have 2 or more columns");
            return false;
        }

        return { columnsCount }
    }

    applyProps(props) {
        this.props = props;
        const columnsCss = `repeat(${this.props.columnsCount}, 1fr)`;
        this.childrenContainer.style.gridTemplateColumns = columnsCss;
    }
}