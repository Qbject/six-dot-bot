import { removeArrayItem } from "./util.js";

// base class handling event subscription
export default class EventEmitter {
    constructor() {
        this.callbacks = {};
    }

    addCallback(eventName, callback) {
        if (!(eventName in this.callbacks)) {
            this.callbacks[eventName] = [];
        }
        this.callbacks[eventName].push(callback);
    }

    removeCallback(eventName, callback) {
        if (eventName in this.callbacks) {
            removeArrayItem(this.callbacks[eventName], callback);
        }
    }

    triggerEvent(eventName, params = []) {
        for (const callback of this.callbacks[eventName] || []) {
            callback(...params);
        }
    }
}