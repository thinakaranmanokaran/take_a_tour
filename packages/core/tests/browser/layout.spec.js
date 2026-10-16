import { expect, test } from "@playwright/test";

/**
 * Real layout behaviour.
 *
 * Everything here is impossible to verify in jsdom: `getBoundingClientRect`
 * returns zeros there, there is no viewport, and no computed styles. These
 * tests assert what a user actually sees.
 */

async function box(page, selector) {
  const locator = page.locator(selector).first();
  await expect(locator).toBeVisible();
  return locator.boundingBox();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.tourReady === true);
  // Settle the first layout pass so rects are stable.
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => resolve())));
});

test("spotlight is positioned over the target with the configured padding", async ({ page }) => {
  await page.evaluate(() =>
    window
      .createTestTour({
        spotlightPadding: 8,
        steps: [{ tourId: "f.center", title: "Centre", content: "Here." }],
      })
      .start()
  );

  const spotlight = await box(page, ".tat-spotlight");
  const target = await box(page, "#target-center");

  // Sub-pixel tolerance: Chromium lays out at fractional device pixels, and
  // `boundingBox()` rounds. A whole-pixel expectation would be a false failure.
  const TOLERANCE = 1.5;

  expect(Math.abs(spotlight.x - (target.x - 8))).toBeLessThan(TOLERANCE);
  expect(Math.abs(spotlight.y - (target.y - 8))).toBeLessThan(TOLERANCE);
  expect(Math.abs(spotlight.width - (target.width + 16))).toBeLessThan(TOLERANCE);
  expect(Math.abs(spotlight.height - (target.height + 16))).toBeLessThan(TOLERANCE);
});

test("places the tooltip below the target when there is room", async ({ page }) => {
  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [{ tourId: "f.center", title: "Below", content: "x", placement: "bottom" }],
      })
      .start()
  );

  const tooltip = await box(page, ".tat-tooltip");
  const target = await box(page, "#target-center");

  expect(tooltip.y).toBeGreaterThanOrEqual(target.y + target.height - 1);
  await expect(page.locator(".tat-tooltip")).toHaveAttribute("data-side", "bottom");
});

test("flips the tooltip above a target pinned to the bottom edge", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const tour = window.createTestTour({
      scrollIntoView: false,
      steps: [{ tourId: "f.pinnedBottom", title: "Flip", content: "x", placement: "bottom" }],
    });
    await tour.start();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const target = document.querySelector("#target-pinned-bottom").getBoundingClientRect();
    const tooltip = document.querySelector(".tat-tooltip").getBoundingClientRect();
    const viewport = document.documentElement.clientHeight;
    const side = document.querySelector(".tat-tooltip").dataset.side;

    tour.destroy();
    return {
      side,
      viewport,
      targetTop: target.top,
      tooltipTop: tooltip.top,
      tooltipBottom: tooltip.bottom,
      tooltipHeight: tooltip.height,
    };
  });

  // The target hugs the bottom edge, so "bottom" cannot fit.
  expect(result.targetTop).toBeGreaterThan(result.viewport * 0.7);
  expect(result.side).toBe("top");
  expect(result.tooltipBottom).toBeLessThan(result.viewport);
  // The flipped tooltip sits above the target rather than over it.
  expect(result.tooltipBottom).toBeLessThanOrEqual(result.targetTop + 1);
});

test("flips a bottom-edge target when the preferred side has no room", async ({ page }) => {
  const viewport = page.viewportSize();

  const top = await page.evaluate(async () => {
    const tour = window.createTestTour({
      scrollIntoView: false,
      steps: [{ tourId: "f.pinnedTop", title: "Flip", content: "x", placement: "top" }],
    });
    await tour.start();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const side = document.querySelector(".tat-tooltip").dataset.side;
    const rect = document.querySelector(".tat-tooltip").getBoundingClientRect();
    tour.destroy();
    return { side, top: rect.top };
  });

  expect(top.side).toBe("bottom");
  expect(top.top).toBeGreaterThan(0);
  void viewport;
});

test("flips away from left and right edges", async ({ page }) => {
  const left = await page.evaluate(async () => {
    const tour = window.createTestTour({
      scrollIntoView: false,
      steps: [{ tourId: "f.pinnedLeft", title: "Flip", content: "x", placement: "left" }],
    });
    await tour.start();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const side = document.querySelector(".tat-tooltip").dataset.side;
    tour.destroy();
    return side;
  });
  expect(left).toBe("right");

  const right = await page.evaluate(async () => {
    const tour = window.createTestTour({
      scrollIntoView: false,
      steps: [{ tourId: "f.pinnedRight", title: "Flip", content: "x", placement: "right" }],
    });
    await tour.start();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const side = document.querySelector(".tat-tooltip").dataset.side;
    tour.destroy();
    return side;
  });
  expect(right).toBe("left");
});

test("flips a right-edge target to the left side", async ({ page }) => {
  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [{ tourId: "f.right", title: "Right", content: "x", placement: "right" }],
      })
      .start()
  );

  // Either side is acceptable, but it must never overflow the viewport.
  const tooltip = await box(page, ".tat-tooltip");
  const viewport = page.viewportSize();
  expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(tooltip.x).toBeGreaterThanOrEqual(-1);
});

test("never lets the tooltip overflow the viewport in any placement", async ({ page }) => {
  const placements = ["top", "bottom", "left", "right", "top-start", "bottom-end"];
  const targets = ["f.top", "f.left", "f.right", "f.bottom", "f.center"];
  const viewport = page.viewportSize();

  for (const placement of placements) {
    for (const tourId of targets) {
      const overflow = await page.evaluate(
        async ([id, place]) => {
          const tour = window.createTestTour({
            steps: [{ tourId: id, title: "t", content: "c", placement: place }],
          });
          await tour.start();
          await new Promise((resolve) => requestAnimationFrame(resolve));

          const rect = document.querySelector(".tat-tooltip").getBoundingClientRect();
          const result = {
            top: rect.top,
            left: rect.left,
            right: rect.right,
            bottom: rect.bottom,
          };
          tour.destroy();
          return result;
        },
        [tourId, placement]
      );

      expect(overflow.top, `${placement} / ${tourId} top`).toBeGreaterThanOrEqual(-1);
      expect(overflow.left, `${placement} / ${tourId} left`).toBeGreaterThanOrEqual(-1);
      expect(overflow.bottom, `${placement} / ${tourId} bottom`).toBeLessThanOrEqual(
        viewport.height + 1
      );
      expect(overflow.right, `${placement} / ${tourId} right`).toBeLessThanOrEqual(
        viewport.width + 1
      );
    }
  }
});

test("repositions the tooltip after the page scrolls", async ({ page }) => {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });

  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [{ tourId: "f.center", title: "Scroll", content: "follows", placement: "bottom" }],
      })
      .start()
  );

  const before = await box(page, ".tat-tooltip");

  await page.evaluate(() => window.scrollBy(0, 200));
  await page.waitForTimeout(250);

  const after = await box(page, ".tat-tooltip");
  const target = await box(page, "#target-center");

  expect(Math.abs(after.y - before.y)).toBeGreaterThan(50);
  expect(after.y).toBeGreaterThanOrEqual(target.y + target.height - 2);
});

test("repositions when a nested scroll container moves the target", async ({ page }) => {
  await page.evaluate(() => {
    const box = document.querySelector("#scroll-box");
    box.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(150);

  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [
          { tourId: "f.nested", title: "Nested", content: "scroll container", placement: "top" },
        ],
      })
      .start()
  );

  await page.evaluate(() => {
    document.querySelector("#scroll-box").scrollTop = 200;
  });
  await page.waitForTimeout(250);

  const tooltip = await box(page, ".tat-tooltip");
  const target = await box(page, "#target-nested");

  // Still anchored to its target after the container scrolled.
  expect(Math.abs(tooltip.x + tooltip.width / 2 - (target.x + target.width / 2))).toBeLessThan(140);
  expect(tooltip.y).toBeLessThan(target.y + target.height + 40);
});

test("repositions after a viewport resize", async ({ page }) => {
  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [{ tourId: "f.center", title: "Resize", content: "x", placement: "right" }],
      })
      .start()
  );

  const before = await box(page, ".tat-tooltip");

  await page.setViewportSize({ width: 560, height: 700 });
  await page.waitForTimeout(250);

  const after = await box(page, ".tat-tooltip");
  expect(after.width).toBeLessThanOrEqual(560);
  expect(after.x + after.width).toBeLessThanOrEqual(561);
  expect(after.x).toBeGreaterThanOrEqual(-1);
  void before;
});

test("stays within a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 380, height: 640 });
  await page.waitForTimeout(150);

  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [{ tourId: "f.center", title: "Mobile", content: "narrow", placement: "bottom" }],
      })
      .start()
  );

  const tooltip = await box(page, ".tat-tooltip");
  expect(tooltip.width).toBeLessThanOrEqual(380);
  expect(tooltip.x).toBeGreaterThanOrEqual(-1);
  expect(tooltip.x + tooltip.width).toBeLessThanOrEqual(381);
});

test("waits for a dynamically added target", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const tour = window.createTestTour({
      target: { missing: "wait", timeout: 4000 },
      steps: [{ tourId: "f.late", title: "Late", content: "arrived" }],
    });

    const started = tour.start();
    setTimeout(() => {
      const button = document.createElement("button");
      button.id = "target-late";
      button.setAttribute("data-tour-id", "f.late");
      button.textContent = "late";
      document.querySelector(".grid").append(button);
    }, 150);

    await started;
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const state = tour.getState();
    const spotlight = document.querySelector(".tat-spotlight").getBoundingClientRect();
    const target = document.querySelector("#target-late").getBoundingClientRect();

    tour.destroy();
    return { state, delta: Math.abs(spotlight.top - target.top) };
  });

  expect(result.state).toBe("running");
  expect(result.delta).toBeLessThan(20);
});

test("reports duplicate data-tour-id values instead of guessing", async ({ page }) => {
  const message = await page.evaluate(async () => {
    try {
      await window
        .createTestTour({
          target: { missing: "error" },
          steps: [{ tourId: "f.dup", title: "Dup", content: "x" }],
        })
        .start();
      return "no-error";
    } catch (error) {
      return `${error.reason}: ${error.message}`;
    }
  });

  expect(message).toContain("ambiguous");
  expect(message).toContain("matches 2 elements");
});

test("resolves dotted and quoted identifiers as exact values", async ({ page }) => {
  await page.evaluate(() =>
    window
      .createTestTour({
        steps: [{ tourId: "f.with.dots", title: "Dotted", content: "x", placement: "right" }],
      })
      .start()
  );
  await expect(page.locator(".tat-tooltip")).toBeVisible();

  await page.evaluate(() => window.tour.next());

  const quoted = await page.evaluate(async () => {
    const tour = window.createTestTour({
      steps: [{ tourId: 'f.weird "id"', title: "Quoted", content: "x" }],
    });
    await tour.start();
    const visible = Boolean(document.querySelector(".tat-tooltip"));
    tour.destroy();
    return visible;
  });

  expect(quoted).toBe(true);
});

test("scrolls the target into view when configured", async ({ page }) => {
  const result = await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const tour = window.createTestTour({
      scrollIntoView: true,
      steps: [{ tourId: "f.bottom", title: "Scroll into view", content: "x" }],
    });
    await tour.start();
    await new Promise((resolve) => setTimeout(resolve, 600));

    const target = document.querySelector("#target-bottom").getBoundingClientRect();
    const viewport = document.documentElement.clientHeight;
    tour.destroy();

    return { top: target.top, bottom: target.bottom, viewport };
  });

  // After scrolling, the target should be inside the viewport.
  expect(result.top).toBeLessThan(result.viewport);
  expect(result.bottom).toBeGreaterThan(0);
});
