/**
 * Progress indicator — bar, dots and step counter.
 *
 * Three independent pieces because different tours need different amounts of
 * orientation: a bar for continuous progress, dots for direct navigation to a
 * known step, and a counter for the plainest case.
 */

import { CLS } from "../../constants.js";
import { createElement, formatTemplate } from "../../utilities/dom.js";

/**
 * @param {object} params
 * @param {number} params.position zero-based
 * @param {number} params.total
 * @param {object} params.labels
 * @param {'bar'|'dots'|'counter'} [params.variant]
 * @param {(stepId: string) => void} [params.onDotClick]
 * @param {Array<{step: object, index: number}>} [params.steps]
 */
export function createProgress({ position, total, labels, variant = "bar", onDotClick, steps }) {
  const container = createElement("div", {
    className: `${CLS.progress} tat-progress`,
  });

  if (variant === "bar" || variant === "dots") {
    const bar = createElement("div", {
      className: `${CLS.progressBar} tat-progress__bar`,
      attributes: {
        role: "progressbar",
        "aria-valuemin": "1",
        "aria-valuemax": String(Math.max(total, 1)),
        "aria-valuenow": String(position + 1),
        "aria-label": labels.stepLabel ?? "Progress",
      },
    });

    const fill = createElement("div", {
      className: `${CLS.progressBarFill} tat-progress__fill`,
    });
    fill.style.width = total > 0 ? `${((position + 1) / total) * 100}%` : "0%";
    bar.append(fill);
    container.append(bar);
  }

  if (variant === "dots") {
    const dots = createElement("div", {
      className: `${CLS.progressDots} tat-progress__dots`,
    });

    (steps ?? []).forEach((entry, index) => {
      const isActive = index === position;
      const stepId = entry.step.tourId;
      const dot = createElement("button", {
        className: [
          `${CLS.progressDot} tat-progress__dot`,
          isActive ? `${CLS.progressDotActive} tat-progress__dot--active` : "",
        ]
          .filter(Boolean)
          .join(" "),
        attributes: {
          type: "button",
          "aria-label": `${labels.stepLabel ?? "Step"} ${index + 1}`,
          "aria-current": isActive ? "step" : undefined,
        },
      });

      if (stepId && typeof onDotClick === "function") {
        dot.addEventListener("click", () => onDotClick(stepId));
      } else {
        dot.disabled = true;
      }

      dots.append(dot);
    });

    container.append(dots);
  }

  if (variant === "counter") {
    container.append(
      createElement("span", {
        className: `${CLS.counter} tat-tooltip__counter`,
        text: formatTemplate(labels.progress, { current: position + 1, total }),
      })
    );
  }

  return container;
}
