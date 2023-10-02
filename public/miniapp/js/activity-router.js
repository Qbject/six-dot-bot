import EventEmitter from "./event-emitter.js";
import { build } from "./util.js";

export default class ActivityRouter extends EventEmitter {
    constructor() {
        super();
        this.curActivity = null;
        this.stack = [];
    }

    setup(){
        this.build();
    }
    
    build() {
        this.activitiesContainer = build("div.activities");
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

        this.stack.push(activity);
        this.updateStack();
    }

    popActivity() {
        this.stack.pop();
        this.updateStack();
    }

    updateStack() {
        this.curActivity?.activityElement?.classList?.remove("active");
        this.curActivity = this.stack[this.stack.length - 1];
        this.curActivity.activityElement.classList.add("active");

        this.triggerEvent("activityChange")
    }
}