/**
 * Overlay — the dimming backdrop.
 *
 * Separate from the spotlight so that "dim the page" and "highlight this
 * element" can be used independently: `spotlight: false` leaves a plain
 * backdrop, while the fallback strategy for a missing target keeps the page
 * dimmed with no cut-out.
 */

import { CLS } from "../../constants.js";
import { createElement } from "../../utilities/dom.js";

export function createOverlay({ clickable = false, onClick } = {}) {
  const overlay = createElement("div", {
    className: [CLS.overlay, "tat-overlay"].filter(Boolean).join(" "),
  });

  // A non-interactive overlay must not swallow clicks meant for the page.
  overlay.style.pointerEvents = clickable ? "auto" : "none";

  if (clickable && typeof onClick === "function") {
    overlay.addEventListener("click", onClick);
  }

  overlay.hidden = false;
  overlay.style.opacity = "0";

  return {
    element: overlay,
    show() {
      overlay.style.opacity = "1";
    },
    hide() {
      overlay.style.opacity = "0";
    },
    destroy() {
      overlay.removeEventListener("click", onClick);
      overlay.remove();
    },
  };
}
