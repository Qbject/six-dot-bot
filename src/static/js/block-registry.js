// singleton class allowing to easily add and remove block classes

export default class BlockRegistry {
    constructor() {
        this.types = {}
    }

    getType(typeName) {
        return this.types[typeName]
    }

    getAllTypes() {
        return Object.entries(this.types);
    }

    registerType(typeClass) {
        this.types[typeClass.typeName] = typeClass;
    }
}

export const blockRegistry = new BlockRegistry();

// import ButtonBlock from "./blocks/button.js";
// blockRegistry.registerType("button", ButtonBlock);

// import CarouselBlock from "./blocks/carousel.js";
// blockRegistry.registerType("carousel", CarouselBlock);

// import CardBlock from "./blocks/card.js";
// blockRegistry.registerType("card", CardBlock);

import HeadingBlock from "./blocks-types/heading.js";
blockRegistry.registerType(HeadingBlock);

import ParagraphBlock from "./blocks-types/paragraph.js";
blockRegistry.registerType(ParagraphBlock);
