import { describe, expect, it } from "vitest";
import {
  choosePlacement,
  computeArrowPosition,
  computeCoordinates,
  measureSpace,
  parsePlacement,
  scorePlacement,
  solvePosition,
} from "../../src/positioning/placements.js";

const VIEWPORT = { width: 1000, height: 800 };
const TOOLTIP = { width: 280, height: 160 };
const OFFSET = { x: 0, y: 12 };

/** Target centred in the viewport. */
function centerRect(width = 200, height = 100) {
  return {
    top: (VIEWPORT.height - height) / 2,
    left: (VIEWPORT.width - width) / 2,
    width,
    height,
    bottom: (VIEWPORT.height + height) / 2,
    right: (VIEWPORT.width + width) / 2,
  };
}

describe("parsePlacement", () => {
  it("splits side and alignment", () => {
    expect(parsePlacement("bottom")).toEqual({ side: "bottom", align: "center" });
    expect(parsePlacement("top-start")).toEqual({ side: "top", align: "start" });
    expect(parsePlacement("right-end")).toEqual({ side: "right", align: "end" });
    expect(parsePlacement("center")).toEqual({ side: "center", align: "center" });
  });

  it("falls back to a safe default for nonsense input", () => {
    expect(parsePlacement("sideways").side).toBe("bottom");
  });
});

describe("measureSpace", () => {
  it("reports the gap to each viewport edge", () => {
    expect(measureSpace(centerRect(), VIEWPORT)).toEqual({
      top: 350,
      right: 400,
      bottom: 350,
      left: 400,
    });
  });

  it("reports negative space for an off-screen target", () => {
    const rect = { top: -50, left: 0, width: 100, height: 40, bottom: -10, right: 100 };
    expect(measureSpace(rect, VIEWPORT).top).toBe(-50);
  });
});

describe("scorePlacement", () => {
  it("scores a placement with room as fitting", () => {
    const result = scorePlacement({
      side: "bottom",
      rect: centerRect(),
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(result.fits).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it("scores a placement without room as not fitting", () => {
    const rect = { ...centerRect(), top: VIEWPORT.height - 20, bottom: VIEWPORT.height + 80 };
    const result = scorePlacement({
      side: "bottom",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(result.fits).toBe(false);
    expect(result.score).toBeLessThan(0);
  });
});

describe("choosePlacement", () => {
  it("keeps the preferred placement when there is room", () => {
    const chosen = choosePlacement({
      placement: "bottom",
      rect: centerRect(),
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(chosen.side).toBe("bottom");
    expect(chosen.flipped).toBe(false);
  });

  it("flips to the opposite side when the preferred one overflows", () => {
    // A target hugging the bottom edge has no room below it.
    const rect = { ...centerRect(), top: 700, bottom: 780 };
    const chosen = choosePlacement({
      placement: "bottom",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(chosen.side).toBe("top");
    expect(chosen.flipped).toBe(true);
  });

  it("falls back to a side with room when the preferred and its opposite are full", () => {
    const rect = { top: 350, left: 0, width: 40, height: 100, bottom: 450, right: 40 };
    const chosen = choosePlacement({
      placement: "left",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(["right", "top", "bottom"]).toContain(chosen.side);
    expect(chosen.side).not.toBe("left");
  });

  it("does not flip when fallback is disabled", () => {
    const rect = { ...centerRect(), top: 700, bottom: 780 };
    const chosen = choosePlacement({
      placement: "bottom",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      fallback: false,
    });
    expect(chosen.side).toBe("bottom");
    expect(chosen.flipped).toBe(false);
  });

  it("uses centre for a centre placement", () => {
    const chosen = choosePlacement({
      placement: "center",
      rect: centerRect(),
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(chosen.side).toBe("center");
    expect(chosen.placement).toBe("center");
  });
});

describe("computeCoordinates", () => {
  it("positions below the target for the bottom placement", () => {
    const rect = centerRect();
    const result = computeCoordinates({
      side: "bottom",
      align: "center",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      arrowSize: { x: 10, y: 6 },
    });

    expect(result.top).toBe(rect.bottom + OFFSET.y + 6);
    expect(result.left).toBe(rect.left + (rect.width - TOOLTIP.width) / 2);
    expect(result.clamped).toBe(false);
  });

  it("positions above the target for the top placement", () => {
    const rect = centerRect();
    const result = computeCoordinates({
      side: "top",
      align: "center",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      arrowSize: { x: 10, y: 6 },
    });

    expect(result.top).toBe(rect.top - OFFSET.y - 6 - TOOLTIP.height);
  });

  it("aligns to the leading edge for `-start`", () => {
    const rect = centerRect();
    const start = computeCoordinates({
      side: "bottom",
      align: "start",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(start.left).toBe(rect.left);

    const end = computeCoordinates({
      side: "bottom",
      align: "end",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });
    expect(end.left).toBe(rect.right - TOOLTIP.width);
  });

  it("centres in the viewport for the centre placement", () => {
    const result = computeCoordinates({
      side: "center",
      align: "center",
      rect: centerRect(),
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });

    expect(result.left).toBe((VIEWPORT.width - TOOLTIP.width) / 2);
    expect(result.top).toBe((VIEWPORT.height - TOOLTIP.height) / 2);
  });

  it("clamps a tooltip that would overflow the right edge", () => {
    const rect = { top: 100, left: 960, width: 30, height: 40, bottom: 140, right: 990 };
    const result = computeCoordinates({
      side: "top",
      align: "end",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      padding: 8,
    });

    expect(result.left).toBeLessThanOrEqual(VIEWPORT.width - TOOLTIP.width - 8);
    expect(result.left).toBeGreaterThanOrEqual(8);
    expect(result.clamped).toBe(true);
  });

  it("clamps a tooltip that would overflow the bottom edge", () => {
    const rect = { top: 600, left: 100, width: 100, height: 40, bottom: 640, right: 200 };
    const result = computeCoordinates({
      side: "bottom",
      align: "start",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      padding: 8,
    });

    expect(result.top).toBeLessThanOrEqual(VIEWPORT.height - TOOLTIP.height - 8);
    expect(result.top).toBeGreaterThanOrEqual(8);
  });

  it("never produces negative coordinates", () => {
    const rect = { top: 0, left: 0, width: 20, height: 20, bottom: 20, right: 20 };
    const result = computeCoordinates({
      side: "top",
      align: "start",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      padding: 8,
    });

    expect(result.top).toBeGreaterThanOrEqual(0);
    expect(result.left).toBeGreaterThanOrEqual(0);
  });
});

describe("computeArrowPosition", () => {
  it("points at the target centre along the cross axis", () => {
    const rect = centerRect();
    const coordinates = computeCoordinates({
      side: "bottom",
      align: "center",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });

    const arrow = computeArrowPosition({ side: "bottom", rect, tooltip: TOOLTIP, coordinates });
    expect(arrow.side).toBe("bottom");
    expect(arrow.y).toBe(0);
    expect(arrow.x).toBeCloseTo(TOOLTIP.width / 2, 5);
  });

  it("keeps the arrow inside the tooltip when the tooltip was clamped", () => {
    const rect = { top: 100, left: 970, width: 20, height: 40, bottom: 140, right: 990 };
    const coordinates = computeCoordinates({
      side: "top",
      align: "end",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      padding: 8,
    });

    const arrow = computeArrowPosition({ side: "top", rect, tooltip: TOOLTIP, coordinates });
    expect(arrow.x).toBeGreaterThanOrEqual(16);
    expect(arrow.x).toBeLessThanOrEqual(TOOLTIP.width - 16);
  });

  it("hides the arrow for a centred placement", () => {
    const arrow = computeArrowPosition({
      side: "center",
      rect: centerRect(),
      tooltip: TOOLTIP,
      coordinates: { top: 0, left: 0 },
    });
    expect(arrow.side).toBe("none");
  });
});

describe("solvePosition", () => {
  it("returns everything the renderer needs in one pass", () => {
    const rect = centerRect();
    const solution = solvePosition({
      placement: "bottom",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
    });

    expect(solution).toMatchObject({
      side: "bottom",
      align: "center",
      placement: "bottom-center",
      flipped: false,
      clamped: false,
    });
    expect(solution.top).toBeGreaterThan(0);
    expect(solution.arrow.side).toBe("bottom");
  });

  it("flips and clamps near a viewport corner", () => {
    const rect = { top: 770, left: 980, width: 20, height: 30, bottom: 800, right: 1000 };
    const solution = solvePosition({
      placement: "bottom",
      rect,
      tooltip: TOOLTIP,
      viewport: VIEWPORT,
      offset: OFFSET,
      padding: 8,
    });

    expect(solution.side).not.toBe("bottom");
    expect(solution.top).toBeGreaterThanOrEqual(0);
    expect(solution.top).toBeLessThanOrEqual(VIEWPORT.height);
    expect(solution.left).toBeGreaterThanOrEqual(0);
    expect(solution.left).toBeLessThanOrEqual(VIEWPORT.width);
  });

  it("always produces coordinates inside the viewport", () => {
    const positions = [
      { top: 0, left: 0, width: 10, height: 10, bottom: 10, right: 10 },
      { top: 790, left: 990, width: 10, height: 10, bottom: 800, right: 1000 },
      { top: 400, left: 0, width: 5, height: 5, bottom: 405, right: 5 },
    ];

    for (const rect of positions) {
      for (const placement of ["top", "bottom", "left", "right", "top-start", "right-end"]) {
        const solution = solvePosition({
          placement,
          rect,
          tooltip: TOOLTIP,
          viewport: VIEWPORT,
          offset: OFFSET,
          padding: 8,
        });
        expect(solution.top).toBeGreaterThanOrEqual(0);
        expect(solution.left).toBeGreaterThanOrEqual(0);
        expect(solution.top).toBeLessThanOrEqual(VIEWPORT.height - TOOLTIP.height);
        expect(solution.left).toBeLessThanOrEqual(VIEWPORT.width - TOOLTIP.width);
      }
    }
  });
});
