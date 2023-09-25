import { getBlockClassByType } from "./blocks-manager.js";
import DragNDropManager from "./drag-n-drop-manager.js";
import { build } from "./util.js";

class EditorApp {
    constructor(container, editMode) {
        this.editMode = editMode;
        this.container = container;
        this.page = build("main.page.blockContainer", container);

        this.schema = {
            "pages": [
                {
                    "id": 1,
                    "children": [
                        {
                            "id": 2,
                            "typeName": "button",
                            "props": {
                                "text": "Click Me!",
                                "url": "https://google.com/"
                            }
                        },
                        {
                            "id": 3,
                            "typeName": "carousel",
                            "children": [
                                {
                                    "id": 4,
                                    "typeName": "card",
                                    "props": {
                                        "title": "TITLE OF CARD 1!",
                                        "description": "Some description goes here"
                                    }
                                },
                                {
                                    "id": 5,
                                    "typeName": "card",
                                    "props": {
                                        "title": "TITLE OF CARD 2!",
                                        "description": "Some description goes here"
                                    }
                                },
                                {
                                    "id": 6,
                                    "typeName": "card",
                                    "props": {
                                        "title": "TITLE OF CARD 3!",
                                        "description": "Some description goes here"
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }

        this.build();

        if (this.editMode) {
            this.dragndrop = new DragNDropManager(this.page,
                this.onBlockMove.bind(this));
            this.dragndrop.attach();
        }
    }

    build() {
        this.blocksMap = {};
        this.buildBlockList(this.schema.pages[0].children, this.page);
    }

    buildBlockList(blockList, parent) {
        parent.innerHTML = "";

        for (const blockSchema of blockList) {
            const blockClass = getBlockClassByType(blockSchema.typeName);
            const block = new blockClass(blockSchema.props);
            this.blocksMap[blockSchema.id] = block;

            const blockElement = block.getElement();
            blockElement.classList.add("block");
            blockElement.dataset.blockId = blockSchema.id;
            parent.append(blockElement);


            if (blockSchema.children) {
                this.buildBlockList(
                    blockSchema.children,
                    blockElement.querySelector(".children")
                );
            }
        }

        build("div.newBlockSuggest", parent);
    }

    onBlockMove(targetBlock, newContainer, newPos) {
        const allSiblings = newContainer.querySelector(":scope>.block");
        const referenceBlock = allSiblings[newPos];

        targetBlock.remove(); // eject from previous place

        if (referenceBlock) {
            newContainer.insertBefore(targetBlock, referenceBlock);
        } else {
            newContainer.append(targetBlock);
        }
    }
}

(function () {
    const appContainer = document.querySelector("#app");
    window.editor = new EditorApp(appContainer, true); // TODO: read url params
})();