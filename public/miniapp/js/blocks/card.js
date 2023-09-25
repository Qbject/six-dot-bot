import { build } from "../util.js";

export default class Card {
    constructor(props) {
        this.props = props;
        this.element = null;
    }

    getElement() {
        return this.element || this.buildElement();
    }

    buildElement() {
        const element = build("div.card");
        const title = build("h3.title", element);
        title.textContent = this.props.title;
        const description = build("p.description", element);
        description.textContent = this.props.description;

        this.element = element;
        return element;
    }
}