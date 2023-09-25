const _blocks = {};

import Button from "./blocks/button.js";
registerBlock("button", Button);

import Carousel from "./blocks/carousel.js";
registerBlock("carousel", Carousel);

import Card from "./blocks/card.js";
registerBlock("card", Card);

function registerBlock(typeName, blockClass){
    _blocks[typeName] = blockClass;
}

export function getBlockClassByType(typeName){
    return _blocks[typeName];
}
