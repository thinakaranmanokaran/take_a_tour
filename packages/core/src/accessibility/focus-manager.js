/**
 * Focus management.
 *
 * Rules, and the reasoning behind them:
 *
 *   - Anchored tooltips are **not** modal. Focus is moved to the tooltip the
 *     first time it appears so keyboard users are not stranded on the page
 *     behind the overlay, but focus is never trapped. Tabbing past the last
 *     control returns to the host page, which is where the user was before.
 *   - Centred modals **are** modal. Focus is trapped inside them for as long as
 *     they are open.
 *   - Whatever element had focus when the tour started gets it back when the
 *     tour ends, for any reason: completion, skip, stop, or destroy.
 */

/**
 * @param {object} params
 * @param {Document|HTMLElement} params.document
 * @param {HTMLElement} [params.container]
 */
export function createFocusManager({ document: doc, container }) {
  let previouslyFocused = null;
  let trapTarget = null;

  return {
    /** Remember the element that invoked the tour. */
    rememberOrigin() {
      const active = doc.activeElement;
      previouslyFocused = active && active !== doc.body ? active : null;
    },

    /**
     * Move focus into the tour.
     * @param {HTMLElement[]} focusables
     * @param {{ modal: boolean }} options
     */
    focusInto(focusables, { modal }) {
      const list = focusables.filter(Boolean);
      if (list.length === 0) return;

      // Prefer the primary action; fall back to the first control.
      const target =
        list.find((element) => element.classList?.contains("tat-btn--primary")) ?? list[0];

      try {
        target.focus({ preventScroll: true });
      } catch {
        target.focus?.();
      }

      if (modal) trapTarget = target;
    },

    /**
     * Handle a Tab press. Returns true when focus was moved.
     * @param {KeyboardEvent} event
     * @param {HTMLElement[]} focusables
     */
    handleTab(event, focusables) {
      if (!trapTarget) return false;

      const list = focusables.filter(Boolean);
      if (list.length === 0) return false;

      const first = list[0];
      const last = list[list.length - 1];
      const active = doc.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return true;
      }
      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
        return true;
      }
      // A click landed outside the trap (for example on the body).
      if (!list.includes(active)) {
        event.preventDefault();
        trapTarget.focus();
        return true;
      }
      return false;
    },

    /** Begin trapping focus inside a modal surface. */
    trapIn(element) {
      trapTarget = element;
    },

    /** Release the trap and restore focus to the invoking element. */
    restore() {
      trapTarget = null;
      if (!previouslyFocused) return;
      if (!previouslyFocused.isConnected) {
        previouslyFocused = null;
        return;
      }
      try {
        previouslyFocused.focus({ preventScroll: true });
      } catch {
        previouslyFocused.focus?.();
      }
      previouslyFocused = null;
    },

    get trapped() {
      return Boolean(trapTarget);
    },

    get container() {
      return container;
    },
  };
}
