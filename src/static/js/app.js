import { blendColors, build, callAPI, sleep } from "./util.js";
import { PageActivity, HomeActivity, NotFoundActivity, ErrorActivity, BlockEditorActivity } from "./activities.js";
import { ControlPanel } from "./control-panel.js";
import ActivityRouter from "./activity-router.js";
import config from "./config.js";

class App {
	constructor() {
		this.dragActive = false;
		this.home = null;

		// assigning whether the app is in mobile environment (web view can
		// slide in and out)
		// assuming isExpanded is false in mobile environment by default
		this.isExpandable = !Telegram.WebApp.isExpanded;
	}

	setup() {
		this.build();

		// calculating highlight colors based on user app theme
		const { text_color, bg_color, button_text_color, button_color } =
			window.Telegram.WebApp.themeParams;
		const highlightColor = blendColors(text_color, bg_color, .9);
		const buttonHighlightColor = blendColors(button_text_color,
			button_color, .9);

		this.appElement.style.setProperty("--highlight-color", highlightColor);
		this.appElement.style.setProperty("--button-highlight-color",
			buttonHighlightColor);

		window.Telegram.WebApp.BackButton.onClick(() => this.goBack());

		// handling navigation
		this.router.addCallback("activityChange", () => {
			const backBtn = window.Telegram.WebApp.BackButton
			this.router.stack.length > 1 ?
				backBtn.show() : backBtn.hide();

			this.updateControlPanel()
		});

		// capturing link clicks to prevent links being opened in webview
		this.appElement.addEventListener("click", event => {
			const clickedLink = event.target.closest("a");
			if (!clickedLink) return;
			event.preventDefault();

			const host = (new URL(clickedLink.href)).host;
			host == "t.me" ?
				window.Telegram.WebApp.openTelegramLink(clickedLink.href) :
				window.Telegram.WebApp.openLink(clickedLink.href);
		});

		// handling custom spoilers
		this.appElement.addEventListener("click", event => {
			const clickedSummary = event.target.closest(".spoiler>.summary");
			if (!clickedSummary) return;
			
			const spoilerElement = clickedSummary.parentElement;
			const isOpen = spoilerElement.dataset.open == "true";
			spoilerElement.dataset.open = !isOpen;
		});
	}

	build() {
		this.appElement = build("div");
		this.appElement.id = "app";

		this.controlPanel = new ControlPanel(this);
		this.controlPanel.setup();
		this.appElement.append(this.controlPanel.panelElement);

		this.router = new ActivityRouter(this.isExpandable ?
			config.use_root_scroll_mobile : config.use_root_scroll_desktop);
		this.router.setup();
		this.appElement.append(this.router.activitiesContainer);
	}

	async getActivityFromResp(pageResp) {
		// reusable logic for constructing activity based on backend response
		if (pageResp.status == 404) return new NotFoundActivity();
		if (!pageResp.ok) return new ErrorActivity();

		const pageData = (await pageResp.json()).result;
		return new PageActivity(pageData);
	}

	connectHomeActivity(activity) {
		// only one home activity can be in the stack,
		this.home = activity;
		this.home.addCallback("pageOpen", pageId =>
			this.openPage(pageId));
		this.home.addCallback("selectionChange", () =>
			this.updateControlPanel());
	}

	connectPageActivity(activity) {
		// extra setup is needed before adding any page activity
		activity.addCallback("blockEdit", block => {
			this.router.pushActivity(new BlockEditorActivity(block));
		});
		activity.addCallback("dragStart", () => this.setDragActive(true));
		activity.addCallback("dragEnd", () => this.setDragActive(false));
	}

	async openPage(pageId, appearInstantly) {
		if (pageId) {
			const pageResp = await callAPI("GET", `pages/${pageId}`);
			const activity = await this.getActivityFromResp(pageResp);
			this.connectPageActivity(activity);
			this.router.pushActivity(activity, appearInstantly);

			return;
		}

		const userPagesResp = await callAPI("GET", "pages/my");
		const userPages = (await userPagesResp.json()).result;
		const page = new HomeActivity(userPages);
		this.router.pushActivity(page, appearInstantly);
		this.connectHomeActivity(page);

		if (!userPages.length) {
			// if user got 0 pages, automatically showing the onboarding page
			await this.createNewPage(true, true);
		}
	}

	async createNewPage(onboarding = false, appearInstantly = false) {
		const pageResp = await callAPI("POST", "pages", { onboarding });
		const activity = await this.getActivityFromResp(pageResp);
		this.connectPageActivity(activity);
		this.router.pushActivity(activity, appearInstantly);

		if (!appearInstantly) {
			// rendering item behind the scenes after the page appear animated
			await sleep(200);
			this.home.addNewPage(activity.initData);
		}
	}

	goBack() {
		if (this.controlPanel.activeMenu) {
			this.controlPanel.toggleMenu(null);
			return;
		}

		this.router.popActivity();
	}

	updateControlPanel() {
		let controlPanelMode = null;
		const curActivity = this.router.curActivity;

		if (curActivity.constructor == HomeActivity) {
			controlPanelMode = curActivity.selectMode ? "homeSelect" : "home";
		} else if (curActivity.constructor == PageActivity) {
			controlPanelMode = "page";
			if (curActivity.editable) controlPanelMode = "pageEdit";
			if (this.dragActive) controlPanelMode = "blockDrag";
		} else if (curActivity.constructor == BlockEditorActivity) {
			controlPanelMode = "blockEditor";
		}

		this.controlPanel.setMode(controlPanelMode);
	}

	setDragActive(isActive) {
		this.dragActive = isActive;
		this.updateControlPanel();
	}
}

(function () {
	const pageParams = new URLSearchParams(document.location.search);
	const startPage = pageParams.get("tgWebAppStartParam")

	window.app = new App();
	window.app.setup();
	document.body.append(window.app.appElement);
	window.app.openPage(startPage, true)
		.then(() => Telegram.WebApp.expand());
})();