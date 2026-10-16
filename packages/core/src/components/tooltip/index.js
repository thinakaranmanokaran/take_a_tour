/**
 * Tooltip — the anchored popover shown beside a target.
 *
 * Composition only: header, body, progress, custom actions and controls are
 * built by their own modules and share the same tokens, so the tooltip, the
 * welcome modal and the completion view look like one product.
 */

import { CLS } from "../../constants.js";
import { createElement } from "../../utilities/dom.js";
import { createBody } from "../content/index.js";
import { createControls, createCustomActions, createIconButton } from "../controls/index.js";
import { createProgress } from "../progress/index.js";

export function createTooltip({ context, config, handlers, steps }) {
  const { step } = context;
  const classes = [CLS.tooltip, "tat-tooltip", config.classes.tooltip].filter(Boolean);

  const tooltip = createElement("div", {
    className: classes.join(" "),
    attributes: {
      role: "dialog",
      "aria-modal": "false",
      "aria-labelledby": "tat-title",
      "data-side": "bottom",
      "data-anchored": "true",
    },
  });

  tooltip.style.width = `var(--tat-tooltip-width)`;

  const arrow = createElement("span", { className: `${CLS.arrow} tat-arrow` });
  arrow.setAttribute("aria-hidden", "true");
  tooltip.append(arrow);

  // Header: title on the left, close on the right.
  const header = createElement("div", {
    className: `${CLS.tooltipHeader} tat-tooltip__header`,
  });

  const titleText =
    step.title === undefined || step.title === null
      ? ""
      : typeof step.title === "function"
        ? step.title(context)
        : String(step.title);

  if (titleText) {
    const heading = createElement("h2", {
      className: `${CLS.tooltipTitle} tat-tooltip__title`,
      text: titleText,
    });
    heading.id = "tat-title";
    header.append(heading);
  }

  if (config.showCloseButton) {
    header.append(
      createIconButton({
        label: config.labels.close,
        icon: "close",
        className: `${CLS.btnClose} tat-btn--close`,
        onClick: handlers.onClose,
      })
    );
  }

  tooltip.append(header);

  if (step.content !== undefined && step.content !== null) {
    tooltip.append(
      createBody({
        content: step.content,
        context,
        config,
        unsafeContent: step.unsafeContent,
      })
    );
  }

  if (config.showProgress) {
    tooltip.append(
      createProgress({
        position: context.position,
        total: context.total,
        labels: config.labels,
        variant: config.showStepCounter ? "counter" : "bar",
        steps,
      })
    );
  }

  const actions = createCustomActions(step.actions, handlers);
  if (actions) tooltip.append(actions);

  tooltip.append(
    createControls({
      labels: config.labels,
      navigation: context.navigation,
      handlers,
      showSkip: context.navigation.canGoNext && !context.navigation.isLast,
      showClose: false,
    })
  );

  return {
    element: tooltip,

    /** Apply a solved position. */
    place(solution) {
      tooltip.dataset.side = solution.side;
      tooltip.style.top = `${solution.top}px`;
      tooltip.style.left = `${solution.left}px`;

      // The arrow only makes sense when the tooltip sits on a side of a
      // target; a centred or side-flipped placement hides it rather than
      // pointing at nothing.
      arrow.hidden = solution.side === "center";
      if (!arrow.hidden) {
        arrow.style.left = `${solution.arrow.x - solution.arrowSize.x / 2}px`;
      }
    },

    /** Control the keyboard shortcut targets. */
    primary() {
      return tooltip.querySelector(".tat-btn--primary");
    },
    secondary() {
      return tooltip.querySelector(".tat-btn--previous");
    },

    /** Reference node for focus placement. */
    focusables() {
      return [...tooltip.querySelectorAll("button:not([disabled])")];
    },

    destroy() {
      tooltip.remove();
    },
  };
}
