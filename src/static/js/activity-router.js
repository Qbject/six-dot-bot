import EventEmitter from "./event-emitter.js";
import { build } from "./util.js";

export default class ActivityRouter extends EventEmitter {
	constructor(useRootScroll = false) {
		// useRootScroll is needed to bypass a scrolling issue on mobile
		// devices. Check out the documentation for more details
		super();
		this.useRootScroll = useRootScroll;
		this.curActivity = null;
		this.stack = [];
	}

	setup() {
		this.build();
	}

	build() {
		this.activitiesContainer = build("div.activities");
		if (this.useRootScroll)
			this.activitiesContainer.classList.add("useRootScroll");
	}

	pushActivity(activity, appearInstantly) {
		// removing activities that follows the current one
		this.activitiesContainer.querySelectorAll(":scope>.active~.activity")
			.forEach(activityElement => activityElement.remove());

		// rendering and showing the new activity
		activity.setup();
		this.activitiesContainer.append(activity.activityElement);
		if (appearInstantly)
			activity.activityElement.classList.add("appearInstantly");

		if (this.useRootScroll) {
			const activityElement = activity.activityElement;

			// preventing inactive activities from stretching body height
			activityElement.addEventListener("transitionrun", event => {
				if (!event.target.classList.contains("activity")) return;
				if (event.target.classList.contains("active"))
					event.target.style.height = "auto";
			});
			activityElement.addEventListener("transitionend", event => {
				if (!event.target.classList.contains("activity")) return;
				if (!event.target.classList.contains("active"))
					event.target.style.height = "0";
			});
		}

		this.stack.push(activity);
		this.updateStack();
	}

	popActivity() {
		this.stack.pop();
		this.updateStack();
	}

	updateStack() {
		if (this.curActivity)
			this.curActivity.activityElement.classList.remove("active");
		this.curActivity = this.stack[this.stack.length - 1];
		this.curActivity.activityElement.classList.add("active");

		this.triggerEvent("activityChange")
	}
}