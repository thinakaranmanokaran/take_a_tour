/**
 * Spotlight — the cut-out highlight around the current target.
 *
 * Implementation choice: a single absolutely-positioned box with a very large
 * spread shadow (`0 0 0 9999px`) produces the cut-out. This is the simplest
 * approach that works without a second full-screen element and without
 * `clip-path` polygons, both of which have worse cross-browser behaviour when
 * the target is near a viewport edge.
 *
 * Documented limitation: the transition animates `top`, `left`, `width` and
 * `height`, so movement between two targets is not GPU-composited. The motion
 * is smooth in practice for typical target sizes, but this is a deliberate
 * simplicity trade-off rather than a claim of pixel-perfect animation through
 * transformed ancestors.
 */

import { CLS } from "../../constants.js";
import { createElement } from "../../utilities/dom.js";

const SPREAD = 9999;

export function createSpotlight() {
  const element = createElement("div", {
    className: `${CLS.spotlight} tat-spotlight`,
    attributes: { "aria-hidden": "true" },
  });

  element.style.position = "absolute";
  element.style.boxShadow = `0 0 0 ${SPREAD}px var(--tat-color-overlay), 0 0 0 3px var(--tat-color-spotlight-ring)`;
  element.style.opacity = "0";
  element.style.pointerEvents = "none";

  let visible = false;

  return {
    element,

    /**
     * Position the highlight over a target rectangle.
     * @param {{ top: number, left: number, width: number, height: number }} rect
     * @param {{ padding?: number, radius?: number }} [options]
     */
    moveTo(rect, { padding = 6, radius = 8 } = {}) {
      element.style.top = `${Math.max(0, rect.top - padding)}px`;
      element.style.left = `${Math.max(0, rect.left - padding)}px`;
      element.style.width = `${Math.max(0, rect.width + padding * 2)}px`;
      element.style.height = `${Math.max(0, rect.height + padding * 2)}px`;
      element.style.borderRadius = `${radius + padding}px`;
    },

    show({ pulse = false } = {}) {
      if (pulse) element.classList.add(`${CLS.spotlight}--pulse`);
      element.style.opacity = "1";
      visible = true;
    },

    hide() {
      element.style.opacity = "0";
      visible = false;
    },

    get visible() {
      return visible;
    },

    destroy() {
      element.remove();
    },
  };
}
