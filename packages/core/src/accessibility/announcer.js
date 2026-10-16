/**
 * Screen-reader announcements.
 *
 * A polite live region announces each step as it appears. The region is always
 * present in the DOM while a tour is mounted — adding it at the moment of the
 * announcement would leave many screen readers silent.
 */

import { CLS } from "../constants.js";
import { createElement, formatTemplate } from "../utilities/dom.js";

export function createAnnouncer({ root, stack }) {
  const region = createElement("div", {
    className: `${CLS.live} tat-live`,
    attributes: {
      role: "status",
      "aria-live": "polite",
      "aria-atomic": "true",
    },
  });

  root.append(region);
  stack.addNode(region);

  let lastMessage = "";

  return {
    /**
     * Announce a step. The region is already in the DOM, which is what makes
     * the announcement reliable — a live region added at the same moment as
     * its text is often missed.
     */
    announceStep({ position, total, labels, title, content }) {
      const progress = formatTemplate(labels.progress, { current: position + 1, total });
      const parts = [progress, title, content].filter(Boolean).join(". ");
      const message = parts.trim() || progress;

      // A repeated step must still be announced, so alternate with an
      // invisible suffix when the text is unchanged.
      region.textContent = message === lastMessage ? `${message} ` : message;
      lastMessage = message;
    },

    announce(message) {
      region.textContent = String(message ?? "");
    },

    destroy() {
      region.remove();
    },
  };
}
