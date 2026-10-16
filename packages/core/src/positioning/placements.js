/**
 * Placement geometry.
 *
 * These are pure functions over rectangles and viewport dimensions. Keeping them
 * free of DOM access is what makes placement testable without a layout engine,
 * and it keeps the measurement code (which does touch the DOM) small.
 *
 * Twelve placements are supported:
 *   top | top-start | top-end
 *   bottom | bottom-start | bottom-end
 *   left | left-start | left-end
 *   right | right-start | right-end
 *   center
 */

import { PLACEMENTS } from "../constants.js";

const SIDES = new Set(["top", "right", "bottom", "left"]);
const ALIGNS = new Set(["start", "center", "end"]);

const PLACEMENT_SET = new Set(PLACEMENTS);

/**
 * Split a placement into its side and cross-axis alignment.
 *
 * @param {string} placement
 * @returns {{ side: 'top'|'right'|'bottom'|'left'|'center', align: 'start'|'center'|'end' }}
 */
export function parsePlacement(placement) {
  if (placement === "center") return { side: "center", align: "center" };

  const [side, align] = String(placement).split("-");
  return {
    side: SIDES.has(side) ? side : "bottom",
    align: ALIGNS.has(align) ? align : "center",
  };
}

/**
 * Preferred fallback order per side.
 *
 * A tooltip that would overflow is moved to the next-best side rather than
 * being allowed to cover its own target.
 */
const FALLBACK_ORDER = {
  top: ["top", "bottom", "right", "left", "center"],
  bottom: ["bottom", "top", "right", "left", "center"],
  left: ["left", "right", "bottom", "top", "center"],
  right: ["right", "left", "bottom", "top", "center"],
  center: ["center"],
};

export function isValidPlacement(placement) {
  return PLACEMENT_SET.has(placement);
}

/**
 * Available space between the target and each viewport edge.
 *
 * @param {{ top: number, right: number, bottom: number, left: number, width: number, height: number }} rect
 * @param {{ width: number, height: number }} viewport
 * @returns {Record<'top'|'right'|'bottom'|'left', number>}
 */
export function measureSpace(rect, viewport) {
  return {
    top: rect.top,
    right: viewport.width - rect.right,
    bottom: viewport.height - rect.bottom,
    left: rect.left,
  };
}

/**
 * How well a placement fits.
 *
 * The score is the space available on the chosen side minus the space the
 * tooltip needs. Higher is better; a non-positive score means overflow.
 *
 * @returns {{ side: string, fits: boolean, score: number, space: number }}
 */
export function scorePlacement({ side, rect, tooltip, viewport, offset, arrowSize = 0 }) {
  const space = measureSpace(rect, viewport);
  const gap = { x: offset?.x ?? 0, y: offset?.y ?? 0 };

  if (side === "center") {
    // A centred tooltip only needs to fit inside the viewport at all.
    const fitsVertically = tooltip.height <= viewport.height;
    const fitsHorizontally = tooltip.width <= viewport.width;
    return {
      side,
      fits: fitsVertically && fitsHorizontally,
      score: Math.min(fitsVertically ? 1 : 0, fitsHorizontally ? 1 : 0),
      space: 0,
    };
  }

  const vertical = side === "top" || side === "bottom";
  const needed = (vertical ? tooltip.height + gap.y : tooltip.width + gap.x) + arrowSize;
  const available = space[side];
  const score = available - needed;

  return { side, fits: score >= 0, score, space: available };
}

/**
 * Pick the best side for a tooltip, falling back when the preferred one
 * overflows the viewport.
 *
 * @param {object} params
 * @param {string} params.placement
 * @param {DOMRect|object} params.rect target rectangle
 * @param {{ width: number, height: number }} params.tooltip measured tooltip size
 * @param {{ width: number, height: number }} params.viewport
 * @param {{ x: number, y: number }} params.offset
 * @param {number} [params.arrowSize]
 * @param {boolean} [params.fallback] set false to keep the preferred placement
 * @returns {{ side: string, align: string, placement: string, flipped: boolean, clamped: boolean }}
 */
export function choosePlacement({
  placement,
  rect,
  tooltip,
  viewport,
  offset,
  arrowSize = 0,
  fallback = true,
}) {
  const { side: preferred, align } = parsePlacement(placement);
  const primary = scorePlacement({ side: preferred, rect, tooltip, viewport, offset, arrowSize });

  let side = preferred;
  if (fallback && !primary.fits) {
    const candidates = FALLBACK_ORDER[preferred] ?? [preferred];
    let best = null;
    for (const candidate of candidates) {
      const scored = scorePlacement({
        side: candidate,
        rect,
        tooltip,
        viewport,
        offset,
        arrowSize,
      });
      if (!best || scored.score > best.score) best = scored;
      if (scored.fits) break;
    }
    if (best) side = best.side;
  }

  return {
    side,
    align: side === "center" ? "center" : align,
    placement: side === "center" ? "center" : `${side}-${align}`,
    flipped: side !== preferred,
  };
}

/**
 * Compute the tooltip's viewport coordinates.
 *
 * @param {object} params
 * @param {string} params.side
 * @param {string} params.align
 * @param {object} params.rect target rectangle
 * @param {{ width: number, height: number }} params.tooltip
 * @param {{ width: number, height: number }} params.viewport
 * @param {{ x: number, y: number }} params.offset
 * @param {number} [params.padding] minimum gap to the viewport edges
 * @param {{ x: number, y: number }} [params.arrowSize]
 * @returns {{ top: number, left: number, clamped: boolean }}
 */
export function computeCoordinates({
  side,
  align,
  rect,
  tooltip,
  viewport,
  offset,
  padding = 8,
  arrowSize = { x: 0, y: 0 },
}) {
  let top = 0;
  let left = 0;
  let clamped = false;

  if (side === "center") {
    top = (viewport.height - tooltip.height) / 2;
    left = (viewport.width - tooltip.width) / 2;
  } else {
    switch (side) {
      case "top":
        top = rect.top - offset.y - arrowSize.y - tooltip.height;
        break;
      case "bottom":
        top = rect.bottom + offset.y + arrowSize.y;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltip.height / 2;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltip.height / 2;
        break;
      default:
        break;
    }

    // Cross-axis alignment.
    switch (side) {
      case "top":
      case "bottom": {
        if (align === "start") left = rect.left;
        else if (align === "end") left = rect.right - tooltip.width;
        else left = rect.left + (rect.width - tooltip.width) / 2;
        break;
      }
      case "left":
      case "right": {
        if (align === "start") top = rect.top;
        else if (align === "end") top = rect.bottom - tooltip.height;
        break;
      }
      default:
        break;
    }

    if (side === "left") left = rect.left - offset.x - arrowSize.x - tooltip.width;
    if (side === "right") left = rect.right + offset.x + arrowSize.x;
  }

  // Clamp so a tooltip never overflows the viewport, even when no side fits.
  const maxLeft = Math.max(padding, viewport.width - tooltip.width - padding);
  const maxTop = Math.max(padding, viewport.height - tooltip.height - padding);

  const clampedLeft = Math.min(Math.max(left, padding), maxLeft);
  const clampedTop = Math.min(Math.max(top, padding), maxTop);
  if (clampedLeft !== left || clampedTop !== top) clamped = true;

  return { top: clampedTop, left: clampedLeft, clamped };
}

/**
 * Position the arrow along the tooltip's edge facing the target.
 *
 * When the tooltip was clamped, the arrow must move to keep pointing at the
 * target rather than staying at the original centre.
 *
 * @returns {{ x: number, y: number, side: string }}
 */
export function computeArrowPosition({ side, rect, tooltip, coordinates }) {
  if (side === "center") return { x: tooltip.width / 2, y: tooltip.height / 2, side: "none" };

  if (side === "top" || side === "bottom") {
    const targetCentre = rect.left + rect.width / 2;
    const raw = targetCentre - coordinates.left;
    const inset = Math.min(Math.max(raw, 16), Math.max(16, tooltip.width - 16));
    return { x: inset, y: side === "bottom" ? 0 : tooltip.height, side };
  }

  const targetCentre = rect.top + rect.height / 2;
  const raw = targetCentre - coordinates.top;
  const inset = Math.min(Math.max(raw, 16), Math.max(16, tooltip.height - 16));
  return { x: side === "right" ? 0 : tooltip.width, y: inset, side };
}

/**
 * Full placement calculation, returning everything the renderer needs in one
 * pass so measurement and write happen together.
 */
export function solvePosition({
  placement,
  rect,
  tooltip,
  viewport,
  offset = { x: 0, y: 12 },
  padding = 8,
  arrowSize = { x: 10, y: 6 },
  fallback = true,
}) {
  const chosen = choosePlacement({
    placement,
    rect,
    tooltip,
    viewport,
    offset,
    arrowSize: arrowSize.y,
    fallback,
  });

  const coordinates = computeCoordinates({
    side: chosen.side,
    align: chosen.align,
    rect,
    tooltip,
    viewport,
    offset,
    padding,
    arrowSize,
  });

  const arrow = computeArrowPosition({
    side: chosen.side,
    rect,
    tooltip,
    coordinates,
  });

  return {
    ...chosen,
    ...coordinates,
    arrow,
    arrowSize,
  };
}
