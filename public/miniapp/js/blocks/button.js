import { build } from "../util.js";

export default class Button {
    constructor(props) {
        this.props = props;
        this.element = null;
    }

    getElement() {
        return this.element || this.buildElement();
    }

    buildElement() {
        const element = build("button");
        element.textContent = this.props.text;
        this.element = element;
        return element;
    }
}