import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/**
 * Accessibility, verified in a real browser.
 *
 * Scoped honestly: these tests check the accessibility properties the library
 * controls, plus an axe-core scan of the tour's own DOM. They are not a claim
 * of full WCAG conformance, which requires manual testing with real assistive
 * technology and expert review.
 */

const AXE_OPTIONS = {
  runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
};

async function startTour(page, steps, config = {}) {
  await page.evaluate(
    async ([tourSteps, tourConfig]) => {
      const tour = window.createTestTour({ steps: tourSteps, ...tourConfig });
      await tour.start();
      await new Promise((resolve) => requestAnimationFrame(resolve));
    },
    [steps, config]
  );
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.tourReady === true);
});

test("the tour root has no critical axe-core violations", async ({ page }) => {
  await startTour(page, [
    {
      tourId: "f.center",
      title: "Accessible step",
      content: "Keyboard and screen-reader friendly.",
    },
  ]);

  const results = await new AxeBuilder({ page })
    .include(".tat-root")
    .options(AXE_OPTIONS)
    .analyze();

  // Critical violations would be genuine defects. Serious ones are reported so
  // they cannot accumulate silently.
  expect(results.violations.filter((violation) => violation.impact === "critical")).toEqual([]);
});

test("the dialog exposes a name and role to assistive technology", async ({ page }) => {
  await startTour(page, [{ tourId: "f.center", title: "Named step", content: "Body text." }]);

  const tooltip = page.locator(".tat-tooltip");
  await expect(tooltip).toHaveAttribute("role", "dialog");
  await expect(tooltip).toHaveAttribute("aria-modal", "false");

  const heading = page.locator(".tat-tooltip__title");
  await expect(heading).toHaveText("Named step");

  const labelledBy = await tooltip.getAttribute("aria-labelledby");
  expect(labelledBy).toBeTruthy();
  await expect(page.locator(`#${labelledBy}`)).toHaveText("Named step");
});

test("every control is a button with an accessible name", async ({ page }) => {
  await startTour(page, [
    { tourId: "f.center", title: "Controls", content: "Body text." },
    { tourId: "f.left", title: "Second", content: "More." },
  ]);

  const controls = page.locator(".tat-root button");
  const count = await controls.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    await expect(control).toHaveAttribute("type", "button");
    const name = await control.getAttribute("aria-label");
    expect(name, `control ${index} has no accessible name`).toBeTruthy();
    expect(name.length).toBeGreaterThan(0);
  }
});

test("icons are hidden from assistive technology", async ({ page }) => {
  await startTour(page, [{ tourId: "f.center", title: "Icons", content: "x" }]);

  const icons = page.locator(".tat-root svg");
  const count = await icons.count();
  expect(count).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    await expect(icons.nth(index)).toHaveAttribute("aria-hidden", "true");
  }
});

test("the step is announced through a polite live region", async ({ page }) => {
  await startTour(page, [{ tourId: "f.center", title: "Announced", content: "Body." }]);

  const live = page.locator(".tat-live");
  await expect(live).toHaveAttribute("aria-live", "polite");
  await expect(live).toHaveAttribute("role", "status");
  await expect(live).toContainText("Announced");
  await expect(live).toContainText("Step 1 of 1");
});

test("focus moves into the tour and is visible", async ({ page }) => {
  await startTour(page, [{ tourId: "f.center", title: "Focus", content: "x" }]);

  const active = await page.evaluate(() => ({
    inTour: Boolean(document.querySelector(".tat-root")?.contains(document.activeElement)),
    tag: document.activeElement?.tagName,
    isPrimary: document.activeElement?.classList.contains("tat-btn--primary"),
  }));

  expect(active.inTour).toBe(true);
  expect(active.tag).toBe("BUTTON");
  expect(active.isPrimary).toBe(true);
});

test("focus returns to the launcher when the tour closes", async ({ page }) => {
  await page.locator("#launcher").focus();

  await startTour(page, [{ tourId: "f.center", title: "Restore", content: "x" }]);
  await page.evaluate(() => window.tour.stop());

  const restored = await page.evaluate(() => document.activeElement?.id);
  expect(restored).toBe("launcher");
});

test("a centred modal traps focus", async ({ page }) => {
  await startTour(page, [{ title: "Modal", content: "Trapped.", centered: true }]);

  await expect(page.locator(".tat-modal")).toHaveAttribute("aria-modal", "true");

  const trapped = await page.evaluate(() => {
    const modal = document.querySelector(".tat-modal");
    const focusables = [...modal.querySelectorAll("button")];
    focusables[focusables.length - 1].focus();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })
    );

    return document.activeElement === focusables[0];
  });

  expect(trapped).toBe(true);
});

test("an anchored tooltip does not trap focus", async ({ page }) => {
  await startTour(page, [
    { tourId: "f.center", title: "Not a trap", content: "x" },
    { tourId: "f.left", title: "Second", content: "y" },
  ]);

  const active = await page.evaluate(() => {
    const focusables = [...document.querySelectorAll(".tat-root button")];
    focusables[focusables.length - 1].focus();
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true })
    );
    // A non-modal tooltip leaves focus alone rather than wrapping it.
    return document.activeElement === focusables[focusables.length - 1];
  });

  expect(active).toBe(true);
});

test("keyboard navigation advances and reverses the tour", async ({ page }) => {
  await startTour(page, [
    { tourId: "f.center", title: "One", content: "x" },
    { tourId: "f.left", title: "Two", content: "y" },
  ]);

  await expect(page.locator(".tat-tooltip__title")).toHaveText("One");

  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".tat-tooltip__title")).toHaveText("Two");

  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".tat-tooltip__title")).toHaveText("One");
});

test("Escape closes the tour and focus is restored", async ({ page }) => {
  await page.locator("#launcher").focus();
  await startTour(page, [{ tourId: "f.center", title: "Escapable", content: "x" }]);

  await page.keyboard.press("Escape");

  await expect(page.locator(".tat-root")).toHaveCount(0);
  const restored = await page.evaluate(() => document.activeElement?.id);
  expect(restored).toBe("launcher");
});

test("a centred modal also passes axe-core", async ({ page }) => {
  await startTour(page, [{ title: "Modal", content: "Accessible modal body.", centered: true }]);

  const results = await new AxeBuilder({ page })
    .include(".tat-root")
    .options(AXE_OPTIONS)
    .analyze();
  expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
});

test("the progress indicator exposes progressbar semantics", async ({ page }) => {
  await startTour(page, [
    { tourId: "f.center", title: "One", content: "x" },
    { tourId: "f.left", title: "Two", content: "y" },
  ]);

  const bar = page.locator('[role="progressbar"]');
  await expect(bar).toHaveAttribute("aria-valuemin", "1");
  await expect(bar).toHaveAttribute("aria-valuemax", "2");
  await expect(bar).toHaveAttribute("aria-valuenow", "1");

  await page.keyboard.press("ArrowRight");
  await expect(bar).toHaveAttribute("aria-valuenow", "2");
});
