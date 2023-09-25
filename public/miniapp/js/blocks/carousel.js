import { build } from "../util.js";

export default class Carousel {
    constructor(props) {
        this.props = props;
        this.element = null;
    }

    getElement() {
        return this.element || this.buildElement();
    }

    buildElement() {
        const element = build("div.carousel");
        build("div.children.blockContainer", element);

        this.element = element;
        return element;
    }
}