/**
 * Event Manager - Publisher-Subscriber Pattern Implementation
 */
class EventManager {
    constructor() {
        this.events = new Map();
        this.onceEvents = new Map();
    }

    /**
     * Subscribe to event
     * @param {string} eventName
     * @param {Function} callback
     * @param {Object} context
     */
    on(eventName, callback, context = null) {
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }

        this.events.get(eventName).push({
            callback,
            context
        });
    }

    /**
     * Subscribe to event once
     * @param {string} eventName
     * @param {Function} callback
     * @param {Object} context
     */
    once(eventName, callback, context = null) {
        if (!this.onceEvents.has(eventName)) {
            this.onceEvents.set(eventName, []);
        }

        this.onceEvents.get(eventName).push({
            callback,
            context
        });
    }

    /**
     * Unsubscribe from event
     * @param {string} eventName
     * @param {Function} callback
     */
    off(eventName, callback) {
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            const index = listeners.findIndex(listener => listener.callback === callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    /**
     * Emit event
     * @param {string} eventName
     * @param {*} data
     */
    emit(eventName, data = null) {
        // Handle regular events
        if (this.events.has(eventName)) {
            const listeners = this.events.get(eventName);
            listeners.forEach(({ callback, context }) => {
                try {
                    callback.call(context, data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }

        // Handle once events
        if (this.onceEvents.has(eventName)) {
            const listeners = this.onceEvents.get(eventName);
            listeners.forEach(({ callback, context }) => {
                try {
                    callback.call(context, data);
                } catch (error) {
                    console.error(`Error in once event listener for ${eventName}:`, error);
                }
            });
            this.onceEvents.delete(eventName);
        }
    }

    /**
     * Clear all listeners for event
     * @param {string} eventName
     */
    clear(eventName) {
        this.events.delete(eventName);
        this.onceEvents.delete(eventName);
    }

    /**
     * Clear all events
     */
    clearAll() {
        this.events.clear();
        this.onceEvents.clear();
    }
}