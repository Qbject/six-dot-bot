import { build, insertChildAtIndex } from "./util.js";

export default class DragNDropManager {
    constructor(rootContainer, onBlockMove = null) {
        this.rootContainer = rootContainer;
        this.onBlockMove = onBlockMove;
        this.resetDragState();
    }

    attach() {
        // avoid conflicts with webview built-in dragging
        this.rootContainer.addEventListener("dragstart",
            e => e.preventDefault());

        this.rootContainer.addEventListener("mousedown", event => {
            const target = event.target.closest(".block");
            if (!target) return;
            this.startDrag(target, event.pageX, event.pageY);
        });

        this.rootContainer.addEventListener("mousemove", event => {
            if (!this.dragState.targetBlock) return;
            this.updateDrag(event.pageX, event.pageY);
        });

        this.rootContainer.addEventListener("mouseup", event => {
            if (!this.dragState.targetBlock) return;
            this.completeDrag();
        });
    }

    setInsertTarget(targetContainer, insertIndex = null) {
        if (insertIndex == null) {
            // append to the end of the container
            const blocks = targetContainer.querySelectorAll(":scope>.block");
            insertIndex = blocks.length;
        }

        if (
            this.dragState.insertTargetContainer === targetContainer &&
            this.dragState.insertTargetIndex === insertIndex
        ) {
            return;
        }

        this.dragState.insertTargetContainer = targetContainer;
        this.dragState.insertTargetIndex = insertIndex;

        console.log(this.dragState.insertTargetContainer);
        console.log(this.dragState.insertTargetIndex);

        this.dragState.insertPreview?.remove();
        this.dragState.insertPreview = build("div.blockInsertPreview");

        insertChildAtIndex(targetContainer, this.dragState.insertPreview,
            insertIndex);
    }

    detach() {
        // TODO: remove event listeners
    }

    startDrag(targetBlock, startX, startY) {
        this.rootContainer.classList.add("dragActive");

        this.dragState.startX = startX;
        this.dragState.startY = startY;

        this.dragState.targetBlock = targetBlock;

        this.rootContainer.classList.add("dragActive");
        targetBlock.classList.add("dragging");

        // TODO: consider only blocks during indexing
        // on drag start, the element tends to keep original position
        const dragTargetIndex = this.getBlockChildIndex(
            this.dragState.targetBlock);
        this.setInsertTarget(this.dragState.targetBlock.parentElement,
            dragTargetIndex);
    }

    updateDrag(curX, curY) {
        this.dragState.shiftX = curX - this.dragState.startX;
        this.dragState.shiftY = curY - this.dragState.startY;

        this.dragState.targetBlock.style.top = this.dragState.shiftY + "px";
        this.dragState.targetBlock.style.left = this.dragState.shiftX + "px";

        const targetRect = this.dragState.targetBlock.getBoundingClientRect();
        const hoverTarget = document.elementFromPoint(
            targetRect.left, targetRect.top);

        if (!this.rootContainer.contains(hoverTarget)) {
            // user drags block outside the root container
            // sticking to the last valid position
            return;
        }

        const targetContainer = hoverTarget.closest(".blockContainer");
        const targetBlock = hoverTarget.closest(".block");

        if (targetContainer.contains(targetBlock)) {
            // user hovers a block over another block

            // insert after the hovered block
            const blockOrderIndex = this.getBlockChildIndex(targetBlock);
            this.setInsertTarget(targetContainer, blockOrderIndex + 1);
        } else {
            // user hovers a block over bare container

            if (targetContainer !== this.dragState.insertTargetContainer) {
                // target container has changed since the last update
                // append to the end of the container
                this.setInsertTarget(targetContainer);
            }
        }
    }

    completeDrag() {
        this.dragState.insertPreview?.remove();

        this.dragState.targetBlock.classList.remove("dragging");
        this.rootContainer.classList.remove("dragActive");

        this.dragState.targetBlock.style.top = "";
        this.dragState.targetBlock.style.left = "";

        this.onBlockMove?.(
            this.dragState.targetBlock,
            this.dragState.insertTargetContainer,
            this.dragState.insertTargetIndex
        );

        this.resetDragState();
    }

    resetDragState() {
        this.dragState = {
            targetBlock: null,
            startX: null,
            startY: null,
            insertTargetContainer: null,
            insertTargetIndex: null,
            insertPreview: null,
        }
    }

    getBlockChildIndex(blockElement) {
        // returns the element's order number among other blocks in container

        const container = blockElement.parentElement;
        const allBlocks = container.querySelectorAll(":scope>.block");
        const orderIndex = Array.from(allBlocks).indexOf(blockElement);
        return orderIndex;
    }
}