/**
 * Live positioning controller.
 *
 * Owns everything that must happen when the page moves: scrolling (window and
 * nested containers), resizing, and the target element itself changing size or
 * position. All observers and listeners are registered on a disposal stack so
 * they are provably released when the tour is torn down.
 *
 * Performance note: measurements are read once and writes happen once, inside a
 * single animation frame. That avoids the read/write interleaving that causes
 * layout thrashing.
 */

import { solvePosition } from "./placements.js";

const VIEWPORT_PADDING = 8;

/**
 * @param {object} params
 * @param {() => Element|null} params.getTarget
 * @param {(position: object) => void} params.onPosition
 * @param {object} params.stack disposal stack from the managed renderer
 */
export function createPositionController({ getTarget, onPosition, stack }) {
  let frame = null;
  let lastRequest = null;

  function measure() {
    const target = getTarget();
    if (!target || !target.isConnected) return null;

    const tooltip = lastRequest?.tooltipElement;
    const tooltipSize = tooltip
      ? { width: tooltip.offsetWidth, height: tooltip.offsetHeight }
      : {
          width: lastRequest?.tooltipSize?.width ?? 280,
          height: lastRequest?.tooltipSize?.height ?? 160,
        };

    const rect = target.getBoundingClientRect();
    const viewport = {
      width: document.documentElement.clientWidth ?? window.innerWidth,
      height: document.documentElement.clientHeight ?? window.innerHeight,
    };

    return { rect, viewport, tooltipSize };
  }

  function compute() {
    frame = null;
    const target = getTarget();
    if (!target || !target.isConnected) return;

    const { rect, viewport, tooltipSize } = measure();
    if (!rect) return;

    const request = lastRequest ?? {};
    const solution = solvePosition({
      placement: request.placement ?? "bottom",
      rect,
      tooltip: tooltipSize,
      viewport,
      offset: request.offset ?? { x: 0, y: 12 },
      padding: VIEWPORT_PADDING,
      arrowSize: request.arrowSize ?? { x: 10, y: 6 },
      fallback: request.fallback !== false,
    });

    onPosition(solution, { rect, viewport });
  }

  function schedule() {
    if (frame !== null) return;
    if (typeof requestAnimationFrame === "function") {
      frame = requestAnimationFrame(compute);
      stack.addFrame(frame);
    } else {
      frame = setTimeout(compute, 16);
      stack.addTimeout(frame);
    }
  }

  // --- observers ---------------------------------------------------------

  const resizeObserver = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
  stack.addObserver(resizeObserver);

  function observeTarget(target) {
    if (!resizeObserver || !target) return;
    resizeObserver.disconnect();
    resizeObserver.observe(target);
  }

  function observeTooltip(tooltipElement) {
    if (!resizeObserver || !tooltipElement) return;
    resizeObserver.observe(tooltipElement);
  }

  // Window-level scroll and resize cover the common cases. Passive listeners
  // keep scrolling smooth.
  if (typeof window !== "undefined") {
    stack.addListener(window, "scroll", schedule, { passive: true, capture: true });
    stack.addListener(window, "resize", schedule, { passive: true });
    stack.addListener(window, "orientationchange", schedule, { passive: true });
  }

  // Visual viewport changes (mobile browser chrome collapsing) move the
  // effective viewport without firing `resize` everywhere.
  if (typeof window !== "undefined" && window.visualViewport) {
    stack.addListener(window.visualViewport, "resize", schedule, { passive: true });
    stack.addListener(window.visualViewport, "scroll", schedule, { passive: true });
  }

  return {
    /**
     * Begin tracking a target for a specific placement.
     * @param {object} request
     */
    setRequest(request) {
      lastRequest = request;
    },

    observeTarget,
    observeTooltip,

    /** Scroll the target into view, then recompute. */
    scrollIntoView() {
      const target = getTarget();
      if (!target || typeof target.scrollIntoView !== "function") return;
      try {
        target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      } catch {
        // Older engines only accept the boolean form.
        target.scrollIntoView(true);
      }
    },

    /** Recompute on the next frame. */
    update: schedule,

    /** Recompute synchronously, for use right after a DOM write. */
    updateNow: compute,

    /**
     * Find scrollable ancestors so scrolling inside a nested container also
     * triggers a reposition. Window capture already covers most cases; this
     * handles programmatic scrolling of a container whose scroll events do not
     * propagate to the document.
     */
    trackScrollContainers(target) {
      if (!target || typeof window === "undefined") return;
      let node = target.parentElement;
      let depth = 0;
      while (node && node !== document.body && node !== document.documentElement && depth < 20) {
        const style = getComputedStyle(node);
        const overflow = `${style.overflow}${style.overflowY}${style.overflowX}`;
        if (/(auto|scroll|overlay)/.test(overflow)) {
          stack.addListener(node, "scroll", schedule, { passive: true });
        }
        node = node.parentElement;
        depth += 1;
      }
    },
  };
}

/** Viewport dimensions, including the visual viewport when present. */
export function getViewportSize() {
  const width = document.documentElement?.clientWidth ?? window.innerWidth ?? 0;
  const height = document.documentElement?.clientHeight ?? window.innerHeight ?? 0;
  return { width, height };
}
