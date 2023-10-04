// singleton class allowing to easily add and remove block type classes

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

import HeadingBlock from "./block-types/heading.js";
blockRegistry.registerType(HeadingBlock);

import ParagraphBlock from "./block-types/paragraph.js";
blockRegistry.registerType(ParagraphBlock);
