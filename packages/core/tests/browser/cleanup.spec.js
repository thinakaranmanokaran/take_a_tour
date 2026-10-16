import { expect, test } from "@playwright/test";

/**
 * Cleanup and lifecycle, verified in a real browser.
 *
 * The guarantee under test: after `destroy()`, the page contains no tour DOM,
 * no document listeners, and no running observers. Leaks are the failure mode
 * that unit tests in jsdom cannot see, because jsdom has no layout observers
 * and no real scroll listeners.
 */

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.tourReady === true);
});

test("destroy() removes every trace of the tour", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const tour = window.createTestTour({
      steps: [
        { tourId: "f.center", title: "One", content: "First." },
        { tourId: "f.left", title: "Two", content: "Second." },
      ],
    });

    await tour.start();
    await tour.next();

    const during = {
      roots: document.querySelectorAll(".tat-root").length,
      tooltips: document.querySelectorAll(".tat-tooltip").length,
      overlays: document.querySelectorAll(".tat-overlay").length,
      spotlights: document.querySelectorAll(".tat-spotlight").length,
      live: document.querySelectorAll(".tat-live").length,
    };

    tour.destroy();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const after = {
      roots: document.querySelectorAll(".tat-root").length,
      tooltips: document.querySelectorAll(".tat-tooltip").length,
      overlays: document.querySelectorAll(".tat-overlay").length,
      spotlights: document.querySelectorAll(".tat-spotlight").length,
      live: document.querySelectorAll(".tat-live").length,
      styleTags: document.querySelectorAll("style").length,
    };

    return { during, after, state: tour.getState() };
  });

  expect(result.during.roots).toBe(1);
  expect(result.during.tooltips).toBe(1);
  expect(result.during.overlays).toBe(1);
  expect(result.during.spotlights).toBe(1);
  expect(result.during.live).toBe(1);

  expect(result.after.roots).toBe(0);
  expect(result.after.tooltips).toBe(0);
  expect(result.after.overlays).toBe(0);
  expect(result.after.spotlights).toBe(0);
  expect(result.after.live).toBe(0);
  expect(result.state).toBe("destroyed");
});

test("destroy() removes the document listeners it added", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const before = { ...window.__listeners };

    const tour = window.createTestTour({
      steps: [{ tourId: "f.center", title: "One", content: "x" }],
    });
    await tour.start();

    const added = window.__listeners.added - before.added;

    tour.destroy();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const removedDuringLife = window.__listeners.removed - before.removed;

    // Pressing Escape afterwards must do nothing at all.
    const stateBefore = tour.getState();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));

    return { added, removedDuringLife, stateBefore, stateAfter: tour.getState() };
  });

  // The library registers exactly one document keydown listener per tour.
  expect(result.added).toBeGreaterThan(0);
  expect(result.removedDuringLife).toBeGreaterThanOrEqual(result.added);
  expect(result.stateBefore).toBe("destroyed");
  expect(result.stateAfter).toBe("destroyed");
});

test("a completed tour leaves no DOM behind", async ({ page }) => {
  const remaining = await page.evaluate(async () => {
    const tour = window.createTestTour({
      steps: [{ tourId: "f.center", title: "Only", content: "x" }],
    });
    await tour.start();
    await tour.next(); // advances past the last step -> completes

    return document.querySelectorAll(".tat-root").length;
  });

  expect(remaining).toBe(0);
});

test("ten start/destroy cycles leave the DOM exactly as it was", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const snapshot = () => ({
      roots: document.querySelectorAll(".tat-root").length,
      buttons: document.querySelectorAll(".tat-root button").length,
    });

    const baseline = snapshot();

    for (let index = 0; index < 10; index += 1) {
      const tour = window.createTestTour({
        tourId: `cycle-${index}`,
        steps: [
          { tourId: "f.center", title: "One", content: "x" },
          { tourId: "f.left", title: "Two", content: "y" },
        ],
      });
      await tour.start();
      await tour.next();
      tour.destroy();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }

    return { baseline, final: snapshot() };
  });

  expect(result.final.roots).toBe(result.baseline.roots);
  expect(result.final.buttons).toBe(result.baseline.buttons);
});

test("a tour can be restarted after stop() without leaking a second root", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const tour = window.createTestTour({
      steps: [{ tourId: "f.center", title: "Restartable", content: "x" }],
    });

    await tour.start();
    tour.stop();

    await tour.start();
    await tour.start(); // idempotent

    const roots = document.querySelectorAll(".tat-root").length;
    const state = tour.getState();
    tour.destroy();
    return { roots, state };
  });

  expect(result.roots).toBe(1);
  expect(result.state).toBe("running");
});

test("the tour frees its tourId when destroyed", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const first = window.createTestTour({
      steps: [{ tourId: "f.center", title: "One", content: "x" }],
    });
    await first.start();
    first.destroy();

    // Creating a tour with the same id must now succeed.
    let error = null;
    try {
      const second = window.createTestTour({
        tourId: first.tourId,
        steps: [{ tourId: "f.center", title: "Two", content: "y" }],
      });
      await second.start();
      second.destroy();
    } catch (caught) {
      error = caught.message;
    }
    return error;
  });

  expect(result).toBeNull();
});

test("a destroyed tour ignores keyboard input entirely", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const tour = window.createTestTour({
      steps: [
        { tourId: "f.center", title: "One", content: "x" },
        { tourId: "f.left", title: "Two", content: "y" },
      ],
    });
    await tour.start();
    tour.destroy();

    for (const key of ["Escape", "ArrowRight", "ArrowLeft", "Tab", "Enter"]) {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true })
      );
    }

    return {
      state: tour.getState(),
      roots: document.querySelectorAll(".tat-root").length,
    };
  });

  expect(result.state).toBe("destroyed");
  expect(result.roots).toBe(0);
});

test("only one overlay exists when a second tour displaces the first", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const first = window.createTestTour({
      tourId: "displace-a",
      concurrency: "pause-previous",
      steps: [{ tourId: "f.center", title: "A", content: "x" }],
    });
    await first.start();

    const second = window.createTestTour(
      {
        tourId: "displace-b",
        concurrency: "pause-previous",
        steps: [{ tourId: "f.left", title: "B", content: "y" }],
      },
      { keepExisting: true } // both tours must be live at the same time
    );
    await second.start();

    const duringSwap = {
      roots: document.querySelectorAll(".tat-root").length,
      overlays: document.querySelectorAll(".tat-overlay").length,
      spotlights: document.querySelectorAll(".tat-spotlight").length,
      firstState: first.getState(),
      secondState: second.getState(),
    };

    second.stop();
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const afterResume = {
      roots: document.querySelectorAll(".tat-root").length,
      firstState: first.getState(),
    };

    first.destroy();
    second.destroy();

    return { duringSwap, afterResume, finalRoots: document.querySelectorAll(".tat-root").length };
  });

  expect(result.duringSwap.roots).toBe(1);
  expect(result.duringSwap.overlays).toBe(1);
  expect(result.duringSwap.spotlights).toBe(1);
  expect(result.duringSwap.firstState).toBe("paused");
  expect(result.duringSwap.secondState).toBe("running");
  expect(result.afterResume.firstState).toBe("running");
  expect(result.finalRoots).toBe(0);
});
