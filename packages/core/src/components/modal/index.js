/**
 * Modal — the centred dialog used for the welcome step, the completion view and
 * any step declared with `placement: "center"`.
 *
 * Unlike the anchored tooltip, this is a real modal: focus is trapped while it
 * is open and restored to the invoking element when it closes.
 */

import { CLS } from "../../constants.js";
import { createElement } from "../../utilities/dom.js";
import { renderContent, resolveText } from "../content/index.js";
import { createControls, createCustomActions, createIconButton } from "../controls/index.js";
import { createProgress } from "../progress/index.js";
import { createIcon } from "../../icons/index.js";

/**
 * @param {object} params
 * @param {object} params.dialog        `{ title, content, icon, actions, unsafeContent }`
 * @param {object} params.context       renderer context
 * @param {object} params.config        normalized tour configuration
 * @param {object} params.handlers      `{ onNext, onPrevious, onSkip, onClose }`
 * @param {object} [params.navigation]  present for step dialogs; absent for intro/completion
 * @param {Array} [params.steps]
 */
export function createModal({ dialog, context, config, handlers, navigation, steps }) {
  const classes = [CLS.modal, "tat-modal", config.classes.modal].filter(Boolean);

  const modal = createElement("div", {
    className: classes.join(" "),
    attributes: {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "tat-modal-title",
    },
  });

  if (dialog.icon) {
    const badge = createElement("div", {
      className: "tat-modal__icon",
      attributes: { "aria-hidden": "true" },
    });
    badge.append(createIcon(dialog.icon, { size: 22 }));
    modal.append(badge);
  }

  const titleText = resolveText(dialog.title, context);
  if (titleText) {
    const header = createElement("div", { className: "tat-modal__header" });
    const heading = createElement("h2", {
      className: `${CLS.tooltipTitle} tat-tooltip__title`,
      text: titleText,
    });
    heading.id = "tat-modal-title";
    header.append(heading);
    modal.append(header);
  }

  if (dialog.content !== undefined && dialog.content !== null) {
    const block = createElement("div", { className: `${CLS.tooltipContent} tat-tooltip__content` });
    renderContent(block, {
      content: dialog.content,
      context,
      config,
      unsafeContent: dialog.unsafeContent,
    });
    if (block.childNodes.length) modal.append(block);
  }

  if (navigation && config.showProgress) {
    modal.append(
      createProgress({
        position: context.position,
        total: context.total,
        labels: config.labels,
        variant: "counter",
        steps,
      })
    );
  }

  const actions = createCustomActions(dialog.actions, handlers);
  if (actions) modal.append(actions);

  if (navigation) {
    if (config.showCloseButton) {
      modal.append(
        createIconButton({
          label: config.labels.close,
          icon: "close",
          className: `${CLS.btnClose} tat-btn--close`,
          onClick: handlers.onClose,
        })
      );
    }

    modal.append(
      createControls({
        labels: config.labels,
        navigation,
        handlers,
        showSkip: navigation.canGoNext && !navigation.isLast,
        showClose: false,
      })
    );
  }

  return {
    element: modal,

    /**
     * Centre within the viewport. The CSS transform is kept and the solved
     * coordinates ignored, because centring via `top`/`left` fights the
     * transform used for the entrance animation.
     */
    place() {
      modal.style.top = "50%";
      modal.style.left = "50%";
      modal.style.transform = "translate(-50%, -50%)";
    },

    focusables() {
      return [
        ...modal.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        ),
      ];
    },

    primary() {
      return modal.querySelector(".tat-btn--primary");
    },

    secondary() {
      return modal.querySelector(".tat-btn--previous");
    },

    destroy() {
      modal.remove();
    },
  };
}
