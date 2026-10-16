/**
 * Controls — skip, previous, next, done and close.
 *
 * All buttons are real `<button type="button">` elements with accessible
 * names. Icons are decorative (`aria-hidden`), because an icon shape is not an
 * accessible name; the label is what a screen reader announces.
 */

import { CLS } from "../../constants.js";
import { createElement } from "../../utilities/dom.js";
import { createIcon } from "../../icons/index.js";

/**
 * @param {object} params
 * @param {string} params.label
 * @param {string} [params.icon]
 * @param {string} [params.variant] primary | ghost | default
 * @param {string} [params.className]
 * @param {Function} params.onClick
 * @param {boolean} [params.disabled]
 * @param {string} [params.iconPosition] before | after
 */
export function createButton({
  label,
  icon,
  variant = "default",
  className,
  onClick,
  disabled = false,
  iconPosition = "before",
}) {
  const classes = [CLS.btn, "tat-btn"];
  if (variant === "primary") classes.push(`${CLS.btnPrimary}`, "tat-btn--primary");
  if (variant === "ghost") classes.push(CLS.btnGhost, "tat-btn--ghost");
  if (className) classes.push(className);

  const button = createElement("button", {
    className: classes.join(" "),
    attributes: { type: "button", "aria-label": label },
    text: icon && iconPosition === "after" ? undefined : label,
    on: { click: onClick },
  });

  if (icon && iconPosition === "before") {
    button.prepend(createIcon(icon));
  }
  if (icon && iconPosition === "after") {
    button.append(createIcon(icon));
  }

  if (disabled) button.disabled = true;

  return button;
}

export function createIconButton({ label, icon, onClick, className }) {
  const button = createButton({
    label,
    icon,
    variant: "default",
    className: [CLS.btnIcon, "tat-btn--icon", className].filter(Boolean).join(" "),
    onClick,
    iconPosition: "after",
  });
  button.textContent = "";
  return button;
}

/**
 * The footer control cluster: skip on the left, navigation on the right.
 */
export function createControls({ labels, navigation, handlers, showSkip, showClose }) {
  const footer = createElement("div", {
    className: `${CLS.tooltipFooter} tat-tooltip__footer`,
  });

  if (showSkip) {
    footer.append(
      createButton({
        label: labels.skip,
        variant: "ghost",
        className: `${CLS.btnSkip} tat-btn--skip`,
        onClick: handlers.onSkip,
      })
    );
  }

  const group = createElement("div", {
    className: `${CLS.controlsGroup} tat-controls__group`,
  });

  if (showClose) {
    group.append(
      createIconButton({
        label: labels.close,
        icon: "close",
        className: `${CLS.btnClose} tat-btn--close`,
        onClick: handlers.onClose,
      })
    );
  }

  if (navigation.canGoPrevious) {
    group.append(
      createButton({
        label: labels.previous,
        icon: "chevron-left",
        variant: "ghost",
        className: `${CLS.btnPrevious} tat-btn--previous`,
        onClick: handlers.onPrevious,
      })
    );
  }

  group.append(
    createButton({
      label: navigation.isLast ? labels.done : labels.next,
      icon: navigation.isLast ? "check" : "chevron-right",
      iconPosition: navigation.isLast ? "before" : "after",
      variant: "primary",
      className: navigation.isLast
        ? `${CLS.btnNext} tat-btn--next tat-btn--done`
        : `${CLS.btnNext} tat-btn--next`,
      onClick: handlers.onNext,
    })
  );

  footer.append(group);
  return footer;
}

/** Custom action buttons supplied by the consumer. */
export function createCustomActions(actions, handlers) {
  if (!Array.isArray(actions) || actions.length === 0) return null;

  const container = createElement("div", {
    className: `${CLS.actions} tat-actions`,
  });

  for (const action of actions) {
    container.append(
      createButton({
        label: action.label,
        variant: action.primary ? "primary" : "default",
        onClick: (event) => {
          const result = action.onClick?.(event);
          handlers.onAction?.(action, result);
        },
      })
    );
  }

  return container;
}
