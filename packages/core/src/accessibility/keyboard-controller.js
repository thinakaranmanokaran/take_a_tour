/**
 * Keyboard controller.
 *
 * Keys are handled on the document rather than the surface so that Escape
 * works even when focus has not yet moved into the tour, and so the tour can
 * be dismissed without trapping the user.
 *
 * Navigation keys are ignored while focus sits in a text field, so typing in a
 * host page form never advances a tour.
 */

const NAVIGATION_KEYS = new Set(["ArrowRight", "ArrowLeft"]);

function isTextEntry(element) {
  if (!element) return false;
  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return element.isContentEditable === true;
}

export function createKeyboardController({
  document: doc,
  stack,
  focusManager,
  getSurface,
  config,
  handlers,
}) {
  function isEnabled() {
    return Boolean(config.keyboardNavigation);
  }

  function onKeyDown(event) {
    if (!isEnabled()) return;
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const surface = getSurface();
    if (!surface) return;

    switch (event.key) {
      case "Escape": {
        if (!config.closeOnEscape) return;
        event.preventDefault();
        handlers.onClose();
        return;
      }

      case "Tab": {
        focusManager.handleTab(event, surface.focusables());
        return;
      }

      case "ArrowRight":
      case "ArrowLeft": {
        if (!NAVIGATION_KEYS.has(event.key)) return;
        if (isTextEntry(doc.activeElement)) return;
        const target = event.key === "ArrowRight" ? surface.primary() : surface.secondary();
        if (!target) return;
        event.preventDefault();
        target.click();
        return;
      }

      case "Home": {
        if (isTextEntry(doc.activeElement)) return;
        if (!handlers.onGoToStart) return;
        event.preventDefault();
        handlers.onGoToStart();
        return;
      }

      case "End": {
        if (isTextEntry(doc.activeElement)) return;
        if (!handlers.onGoToEnd) return;
        event.preventDefault();
        handlers.onGoToEnd();
        return;
      }

      default:
        break;
    }
  }

  stack.addListener(doc, "keydown", onKeyDown);

  return {
    destroy() {
      // Listener removal is handled by the disposal stack.
    },
  };
}
