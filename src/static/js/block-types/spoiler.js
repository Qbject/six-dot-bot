import Block from "../block.js";
import { build, buildCheckbox } from "../util.js";

export default class SpoilerBlock extends Block {
    static name = "Spoiler";
    static typeName = "spoiler";

    getDefaultProps() {
        return {
            headText: "Spoiler title",
            defaultOpen: false
        }
    }

    buildContent() {
        this.blockElement.classList.add("spoiler");
        this.spoilerElement = build("details", this.blockElement);
        this.headElement = build("summary", this.spoilerElement);
        this.bodyElement = build("div.body", this.spoilerElement);
        this.childrenContainer = build("div.blocksContainer",
            this.bodyElement);
    }

    buildSettings() {
        this.textInput = build("input", this.settingsElement);
        this.textInput.value = this.props.headText;

        const defaultOpenSetting = build("div.setting", this.settingsElement);
        this.defaultOpenHint = build("div.hint", defaultOpenSetting);
        [, this.defaultOpenCheckbox] = buildCheckbox(null, "defaultOpen",
            defaultOpenSetting);
        this.defaultOpenCheckbox.checked = this.props.defaultOpen;
    }

    readSettings() {
        const headText = this.textInput.value.trim();
        const defaultOpen = this.defaultOpenCheckbox.checked;

        return { headText, defaultOpen }
    }

    applyProps(props) {
        this.props = props;
        
        this.headElement.textContent = this.props.headText;
        this.spoilerElement.open = this.editMode || this.props.defaultOpen;
    }
}