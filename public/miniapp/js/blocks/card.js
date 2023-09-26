import { build } from "../util.js";

export default class Card {
    constructor(props) {
        this.props = props;
        this.element = null;
    }

    getContents() {
        return this.element || this.buildElement();
    }

    build(blockElement) {
        const element = build("div.card", blockElement);
        const title = build("h3.title", element);
        title.textContent = this.props.title;
        const description = build("p.description", element);
        description.textContent = this.props.description;
        this.element = element;
    }
}