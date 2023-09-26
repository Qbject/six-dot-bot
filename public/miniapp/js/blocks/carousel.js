import { build } from "../util.js";

export default class Carousel {
    constructor(props) {
        this.props = props;
        this.element = null;
    }

    build(blockElement) {
        const element = build("div.carousel", blockElement);
        build("div.children.blockContainer", element);
    }
}