import { blockRegistry } from "./block-registry.js";
import { build, buildCheckbox, callAPI, isTouchDevice, removeArrayItem, sleep, tgConfirm } from "./util.js";
import config from "./config.js";
import EventEmitter from "./event-emitter.js";

export class PageActivity extends EventEmitter {
	constructor(pageData) {
		super();
		this.initData = pageData;
		this.schema = JSON.parse(pageData.schema);
		this.id = pageData.id;
		this.allBlocks = [];

		const curUser = window.Telegram.WebApp.initDataUnsafe.user;
		const isOwn = pageData.ownerId === curUser.id;
		this.editable = isOwn;
	}

	setup() {
		this.build();

		if (!this.editable) return

		this.setupDragNDrop();

		this.activityElement.addEventListener("click", event => {
			const blockElement = event.target.closest(".block");
			if (!blockElement) return;

			// user clicked a block, triggering event
			const targetBlock = this.getBlockObject(blockElement);
			this.triggerEvent("blockEdit", [targetBlock])
			event.preventDefault();
			event.stopPropagation();
		}, { capture: true })
	}

	build() {
		this.activityElement = build("div.activity.page");
		if (this.editable) this.activityElement.classList.add("editable");
		this.contentElement = build("div.content", this.activityElement);

		this.blocksContainer = build("div.blocksContainer",
			this.contentElement);
		this.settingsModal = build("div.settingsModal", this.activityElement);

		this.applySchema(this.schema);
	}

	setupDragNDrop() {
		const setupContainer = container => {
			return new Sortable(container, {
				group: "editablePage",
				animation: 150,
				delay: 300,
				delayOnTouchOnly: true,
				fallbackOnBody: true,
				swapThreshold: 0.5,
				onAdd: event => {
					const isPreview = ["block", "preview"].every(c =>
						event.item.classList.contains(c));

					if (isPreview) {
						// handle adding new block from catalog
						const blockTypeName = event.item.dataset.typeName;
						const blockClass = blockRegistry.getType(
							blockTypeName);
						const block = new blockClass(null, this.editable);
						block.setup();
						this.allBlocks.push(block);
						event.item.replaceWith(block.blockElement);
					}

					this.setupDragNDrop(); // this method will initialize
					// a new sortable for the block if needed
				},
				onStart: () => this.triggerEvent("dragStart"),
				onEnd: () => {
					this.triggerEvent("dragEnd");
					this.save();
				},
			});
		}

		if (!this.sortable)
			this.sortable = setupContainer(this.blocksContainer);

		for (const block of this.allBlocks) {
			if (!block.childrenContainer) continue;
			if (block.sortable) continue;
			block.sortable = setupContainer(block.childrenContainer);
		}
	}

	getBlockObject(blockElement) {
		return this.allBlocks.find(block =>
			block.blockElement == blockElement);
	}

	async save() {
		// saves page to the database on the server
		await callAPI("POST", `pages/${this.id}`, {
			schema: JSON.stringify(this.readSchema()),
			title: this.getTitle()
		})
	}

	applySchema(schema) {
		// building DOM according to given page schema

		const fillContainer = (blockList, container) => {
			container.innerHTML = "";
			if (!blockList) return;

			for (const blockSchema of blockList) {
				const blockClass = blockRegistry.getType(blockSchema.typeName);
				const block = new blockClass(blockSchema.props, this.editable);
				this.allBlocks.push(block);

				block.setup();
				container.append(block.blockElement);

				if (block.childrenContainer)
					fillContainer(blockSchema.children, block.childrenContainer);
			}
		}

		fillContainer(schema.children, this.blocksContainer);
	}

	readSchema() {
		// traversing blocks hierarchy to construct page schema

		const readBlockSchema = (block) => {
			const blockSchema = {
				typeName: block.constructor.typeName,
				props: block.props,
				children: block.childrenContainer ?
					readContainerSchema(block.childrenContainer) : null
			}
			return blockSchema;
		}

		const readContainerSchema = (containerElement) => {
			const containerBlocks = [];

			for (const blockElement of containerElement.children) {
				const block = this.getBlockObject(blockElement);
				const blockSchema = readBlockSchema(block);
				containerBlocks.push(blockSchema);
			}
			return containerBlocks;
		}

		return {
			"children": readContainerSchema(this.blocksContainer)
		};
	}

	getTitle() {
		// getting title from a first heding on the page

		const heading = this.activityElement.querySelector("h1");
		return heading?.textContent || "";
	}

	getLink() {
		return `https://t.me/${config.bot_username}/${config.bot_appname}`
			+ `?startapp=${this.id}`
	}
}

export class BlockEditorActivity extends EventEmitter {
	constructor(targetBlock) {
		super();
		this.targetBlock = targetBlock;
	}

	setup() {
		this.build();
	}

	build() {
		this.activityElement = build("div.activity.blockEditor");
		this.contentElement = build("div.content", this.activityElement);
		this.contentElement.append(this.targetBlock.settingsElement);
	}

	async apply() {
		return await this.targetBlock.applySettings();
	}
}

export class HomeActivity extends EventEmitter {
	constructor(userPages) {
		super();
		this.userPages = userPages;
		this.selectMode = false;
		this.selectedPages = [];
		this.longPressDelay = 500;
	}

	setup() {
		this.build();
	}

	build() {
		this.activityElement = build("div.activity.home");
		this.contentElement = build("div.content", this.activityElement);

		this.titleElement = build("h1", this.contentElement);
		this.titleElement.textContent = "My Pages";

		this.pageList = build("ul.pageList", this.contentElement);
		this.pageList.dataset.longPressDelay = this.longPressDelay;

		for (const pageData of this.userPages) {
			this.pageList.append(this.buildPageItem(pageData));
		}

		this.pageList.addEventListener("click", event => {
			const itemElement = event.target.closest(".pageItem");
			if (!itemElement) return;
			const selecting = !!event.target.closest(".selectHandle");
			event.preventDefault(); // prevent cursor label click action

			this.onItemInteraction(itemElement.dataset.pageId, selecting);
		});

		if (isTouchDevice()) {
			let lastViewportChange = 0;
			// TODO: cleanup
			Telegram.WebApp.onEvent("viewportChanged", () =>
				lastViewportChange = Date.now())

			this.pageList.addEventListener("long-press", event => {
				const itemElement = event.target.closest(".pageItem");
				if (!itemElement) return;

				// preventing false triggering during viewport change gesture
				if (Date.now() - lastViewportChange < this.longPressDelay)
					return;

				this.onItemInteraction(itemElement.dataset.pageId, true);
			});
		}
	}

	buildPageItem(pageData) {
		const itemElement = build("li.pageItem");
		itemElement.dataset.pageId = pageData.id;

		const pageInfoElement = build("div.pageInfo", itemElement);
		const pageTitleElement = build("div.pageTitle", pageInfoElement);
		const pageTimeElement = build("div.pageTime", pageInfoElement);
		const selectHandle = build("div.selectHandle", itemElement);
		buildCheckbox(null, "pageitemSelect", selectHandle);
		build("div.rippleJS", itemElement);

		pageTitleElement.textContent = pageData.title || "Unnamed";
		if (!pageData.title) pageTitleElement.classList.add("unnamed");

		const modifiedAt = new Date(pageData.modifiedAt + "Z");
		pageTimeElement.textContent = modifiedAt.toLocaleString();

		return itemElement;
	}

	onItemInteraction(pageId, selecting) {
		if (this.selectMode || selecting) {
			if (this.selectedPages.includes(pageId)) {
				removeArrayItem(this.selectedPages, pageId);
			} else {
				this.selectedPages.push(pageId);
			}
			this.updateSelectedPages();
			return;
		}

		this.triggerEvent("pageOpen", [pageId]);
	}

	updateSelectedPages() {
		this.selectMode = !!this.selectedPages.length;
		this.pageList.classList.toggle("selectMode", this.selectMode);

		for (const itemElement of this.pageList.children) {
			itemElement.classList.toggle("selected",
				this.selectedPages.includes(itemElement.dataset.pageId));
		}

		this.triggerEvent("selectionChange");
	}

	updatePageitems() {
		// building items for newly added pages
		for (const pageData of this.userPages) {
			const itemSelector = `.pageItem[data-page-id="${pageData.id}"]`;
			const itemElement = this.pageList.querySelector(itemSelector);

			if (!itemElement)
				this.pageList.prepend(this.buildPageItem(pageData));
		}

		// removing releted items for deleted pages (with animation)
		const deletedItems = [];
		for (const pageItem of this.pageList.children) {
			const itemDeleted = !this.userPages.find(pageData =>
				pageData.id == pageItem.dataset.pageId)

			if (itemDeleted) {
				pageItem.classList.add("deleted");
				deletedItems.push(pageItem);
			}
		}
		// deleting from DOM after animation is complete
		return sleep(500).then(() => deletedItems.map(el => el.remove()));
	}

	async deleteSelectedPages() {
		const delCount = this.selectedPages.length;
		const confirmMessage = `Are you sure you want to delete ${delCount} ` +
			`page${delCount - 1 ? "s" : ""}?`;
		const confirmed = await tgConfirm(confirmMessage);
		if (!confirmed) return;

		for (const pageId of this.selectedPages) {
			await callAPI("DELETE", `pages/${pageId}`)
		}
		this.userPages = this.userPages.filter(pageData =>
			!this.selectedPages.includes(pageData.id));

		this.selectedPages = [];
		this.updateSelectedPages();
		this.updatePageitems();
	}

	addNewPage(pageData) {
		this.userPages.unshift(pageData);
		this.updatePageitems();
	}
}

export class NotFoundActivity extends EventEmitter {
	constructor() {
		super();
	}

	setup() {
		this.build();
	}

	build() {
		this.activityElement = build("div.activity.notFound");
		this.contentElement = build("div.content", this.activityElement);
		this.animationElement = build("div.animation", this.contentElement);

		this.animation = lottie.loadAnimation({
			container: this.animationElement,
			renderer: "svg",
			loop: true,
			autoplay: true,
			path: "/lottie/404.json",
		});
	}
}

export class ErrorActivity extends EventEmitter {
	constructor() {
		super();
	}

	setup() {
		this.build();
	}

	build() {
		this.activityElement = build("div.activity.error");
		this.contentElement = build("div.content", this.activityElement);
		this.animationElement = build("div.animation", this.contentElement);
		this.captionElement = build("div.caption", this.contentElement);
		this.captionElement.textContent = "ERROR";

		this.animation = lottie.loadAnimation({
			container: this.animationElement,
			renderer: "svg",
			loop: false,
			autoplay: true,
			path: "/lottie/error.json",
		});
	}
}