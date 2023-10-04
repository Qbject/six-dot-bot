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

import MarkdownBlock from "./block-types/markdown.js";
blockRegistry.registerType(MarkdownBlock);

import SpoilerBlock from "./block-types/spoiler.js";
blockRegistry.registerType(SpoilerBlock);

import GridBlock from "./block-types/grid.js";
blockRegistry.registerType(GridBlock);
