/**
 * Minimal event emitter.
 *
 * Two properties matter for a library like this:
 *
 *  1. A listener that throws must never leave the engine half-transitioned.
 *     Every emit therefore isolates failures and routes them to `onError`.
 *  2. Unsubscribing must be cheap and reliable, so `on()` returns a function.
 */

import { TakeATourError } from "../errors/index.js";

export function createEmitter({ onError } = {}) {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();
  let destroyed = false;

  function reportError(error, event) {
    if (typeof onError === "function") {
      try {
        onError(error instanceof Error ? error : new Error(String(error)), { event });
      } catch {
        // A failing error reporter must not escalate.
      }
    }
  }

  function getSet(event, create = false) {
    let set = listeners.get(event);
    if (!set && create) {
      set = new Set();
      listeners.set(event, set);
    }
    return set;
  }

  return {
    /**
     * Subscribe to an event.
     * @returns {() => void} unsubscribe
     */
    on(event, handler) {
      if (typeof handler !== "function") {
        throw new TakeATourError(`Listener for "${event}" must be a function.`, {
          code: "TAT_EVENT",
        });
      }
      if (destroyed) return () => {};
      getSet(event, true).add(handler);
      return () => this.off(event, handler);
    },

    /** Subscribe for a single emission. */
    once(event, handler) {
      if (typeof handler !== "function") {
        throw new TakeATourError(`Listener for "${event}" must be a function.`, {
          code: "TAT_EVENT",
        });
      }
      const wrapped = (payload) => {
        this.off(event, wrapped);
        handler(payload);
      };
      getSet(event, true).add(wrapped);
      return () => this.off(event, wrapped);
    },

    off(event, handler) {
      const set = listeners.get(event);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) listeners.delete(event);
    },

    /**
     * Invoke every listener for `event`.
     *
     * Returns a promise that resolves once all synchronous listeners have run.
     * Synchronous listeners are invoked in registration order.
     */
    emit(event, payload) {
      if (destroyed) return Promise.resolve([]);
      const set = listeners.get(event);
      if (!set || set.size === 0) return Promise.resolve([]);

      // Copy so a listener may unsubscribe during dispatch.
      const snapshot = [...set];
      const errors = [];
      const pending = [];

      for (const handler of snapshot) {
        try {
          const result = handler(payload);
          if (result && typeof result.then === "function") {
            pending.push(
              Promise.resolve(result).catch((error) => {
                errors.push(error);
              })
            );
          }
        } catch (error) {
          errors.push(error);
        }
      }

      const dispatch = Promise.all(pending).then(() => {
        for (const error of errors) reportError(error, event);
        return errors;
      });

      // Async listeners must not block synchronous navigation, but an
      // unhandled rejection here would be invisible. Swallow into the same
      // reporting path via a detached catch.
      if (pending.length) dispatch.catch(reportError);
      return dispatch;
    },

    listenerCount(event) {
      return listeners.get(event)?.size ?? 0;
    },

    /** Drop all listeners, or all listeners for one event. */
    clear(event) {
      if (event === undefined) listeners.clear();
      else listeners.delete(event);
    },

    /** Permanently disable the emitter. Used on destroy. */
    destroy() {
      destroyed = true;
      listeners.clear();
    },

    get destroyed() {
      return destroyed;
    },
  };
}
