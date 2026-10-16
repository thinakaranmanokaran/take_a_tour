import { expect, test } from "@playwright/test";

/**
 * Proves the documentation site runs the real library.
 *
 * These assertions cannot be satisfied by a mockup: they check that a
 * `.tat-root` with the library's own class names appears, that the spotlight has
 * real geometry derived from `getBoundingClientRect()`, and that the tour
 * responds to configuration the visitor typed into the page.
 */

async function gotoPlayground(page) {
  await page.goto("/playground");
  await page.waitForFunction(() => window.playground !== undefined);
  await page.waitForSelector("#preview .preview__nav");
}

test("the playground starts a real tour", async ({ page }) => {
  await gotoPlayground(page);

  await expect(page.locator(".tat-root")).toHaveCount(0);

  await page.locator("#pg-start").click();
  await expect(page.locator(".tat-root")).toHaveCount(1);

  // The library's own class names, not the docs site's.
  await expect(page.locator(".tat-overlay")).toHaveCount(1);
  await expect(page.locator(".tat-spotlight")).toHaveCount(1);
  await expect(page.locator(".tat-tooltip")).toHaveCount(1);
  await expect(page.locator(".tat-tooltip__title")).toHaveText("Start here");
});

/**
 * Wait until scrolling and the element's position have both settled.
 *
 * The tour scrolls its target into view with smooth behaviour, so measuring
 * immediately after the tooltip appears can catch it mid-animation. Requiring
 * several *consecutive* stable frames avoids exiting early in the gap between
 * the scroll starting and the first scroll frame landing.
 */
async function waitForStablePosition(page, selector, { stableFrames = 8, maxFrames = 240 } = {}) {
  return page.evaluate(
    async ([sel, required, max]) => {
      const element = document.querySelector(sel);
      if (!element) return false;

      let previous = null;
      let stable = 0;

      for (let index = 0; index < max; index += 1) {
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const rect = element.getBoundingClientRect();
        const signature = `${window.scrollY.toFixed(1)},${rect.x.toFixed(1)},${rect.y.toFixed(1)}`;

        stable = signature === previous ? stable + 1 : 0;
        previous = signature;

        if (stable >= required) return true;
      }
      return false;
    },
    [selector, stableFrames, maxFrames]
  );
}

test("the spotlight has real geometry around a real target", async ({ page }) => {
  await gotoPlayground(page);
  await page.locator("#pg-start").click();
  await expect(page.locator(".tat-spotlight")).toBeVisible();

  // The tour scrolls its target into view smoothly; wait for that to settle
  // before comparing rects.
  await waitForStablePosition(page, ".tat-spotlight");

  const { spotlight, target } = await page.evaluate(() => {
    const s = document.querySelector(".tat-spotlight").getBoundingClientRect();
    const t = document.querySelector(".preview__nav").getBoundingClientRect();
    return {
      spotlight: { x: s.x, y: s.y, width: s.width, height: s.height },
      target: { x: t.x, y: t.y, width: t.width, height: t.height },
    };
  });

  // The spotlight is padded around the target, not somewhere arbitrary.
  expect(Math.abs(spotlight.x - (target.x - 6))).toBeLessThan(3);
  expect(Math.abs(spotlight.y - (target.y - 6))).toBeLessThan(3);
  expect(Math.abs(spotlight.width - (target.width + 12))).toBeLessThan(3);
  expect(Math.abs(spotlight.height - (target.height + 12))).toBeLessThan(3);
});

test("the Next button advances through the edited configuration", async ({ page }) => {
  await gotoPlayground(page);
  await page.locator("#pg-start").click();

  await expect(page.locator(".tat-tooltip__title")).toHaveText("Start here");
  await page.locator("#pg-next").click();
  await expect(page.locator(".tat-tooltip__title")).toHaveText("Real DOM targets");

  await page.locator("#pg-next").click();
  await expect(page.locator(".tat-tooltip__title")).toHaveText("The end");
});

test("editing the JSON changes the tour the visitor sees", async ({ page }) => {
  await gotoPlayground(page);

  // A single-step tour with a different title, typed into the real editor.
  const config = {
    tourId: "edited-in-browser",
    steps: [
      {
        tourId: "play.cta",
        title: "Edited in the browser",
        content: "This came from the textarea.",
      },
    ],
  };

  await page.locator("#config-input").fill(JSON.stringify(config, null, 2));
  await page.locator("#pg-start").click();

  await expect(page.locator(".tat-tooltip__title")).toHaveText("Edited in the browser");
  await waitForStablePosition(page, ".tat-spotlight");

  // And it is anchored to the requested target, not the first one.
  const delta = await page.evaluate(() => {
    const s = document.querySelector(".tat-spotlight").getBoundingClientRect();
    const t = document.querySelector(".preview__cta").getBoundingClientRect();
    return Math.abs(s.x - t.x);
  });
  expect(delta).toBeLessThan(30);
});

test("an invalid configuration surfaces the library's own error", async ({ page }) => {
  await gotoPlayground(page);

  await page.locator("#config-input").fill('{ "tourId": "broken", "steps": [] }');
  await page.locator("#pg-start").click();

  // The message is the library's, not the playground's invention.
  await expect(page.locator("#playground-status")).toHaveAttribute("data-variant", "error");
  await expect(page.locator("#playground-status")).toContainText("at least one step");
  await expect(page.locator(".tat-root")).toHaveCount(0);
});

test("invalid JSON is reported without breaking the page", async ({ page }) => {
  await gotoPlayground(page);

  await page.locator("#config-input").fill("{ not json ");
  await page.locator("#pg-start").click();

  await expect(page.locator("#playground-status")).toContainText("Invalid JSON");
  await expect(page.locator("#playground-status")).toHaveAttribute("data-variant", "error");
});

test("the theme switcher restyles a live tour", async ({ page }) => {
  await gotoPlayground(page);
  await page.locator("#pg-start").click();

  const root = page.locator(".tat-root");
  await expect(root).toHaveAttribute("data-tat-theme", "light");

  await page.locator("#pg-theme").selectOption("dark");
  await expect(root).toHaveAttribute("data-tat-theme", "dark");

  await page.locator("#pg-theme").selectOption("system");
  await expect(root).toHaveAttribute("data-tat-theme", "light"); // no OS dark mode in CI
});

test("destroying removes the overlay and re-enables Start", async ({ page }) => {
  await gotoPlayground(page);
  await page.locator("#pg-start").click();
  await expect(page.locator(".tat-root")).toHaveCount(1);

  await page.locator("#pg-destroy").click();
  await expect(page.locator(".tat-root")).toHaveCount(0);
  await expect(page.locator("#pg-start")).toBeEnabled();
});

test("the component gallery starts a real tour", async ({ page }) => {
  await page.goto("/components");
  await page.locator("#gallery-start").click();

  await expect(page.locator(".tat-root")).toHaveCount(1);
  await expect(page.locator(".tat-modal")).toHaveCount(1); // first step is centred

  // Advance to an anchored step and confirm the spotlight tracks a real target.
  await page.locator(".tat-btn--next").click();
  await expect(page.locator(".tat-tooltip")).toBeVisible();
  await waitForStablePosition(page, ".tat-spotlight");

  const delta = await page.evaluate(() => {
    const s = document.querySelector(".tat-spotlight").getBoundingClientRect();
    const t = document.querySelector('[data-tour-id="gallery.panel"]').getBoundingClientRect();
    return { x: Math.abs(s.x - (t.x - 6)), y: Math.abs(s.y - (t.y - 6)) };
  });
  expect(delta.x).toBeLessThan(3);
  expect(delta.y).toBeLessThan(3);
});

test("the theme customiser restyles a live tour", async ({ page }) => {
  await page.goto("/themes");
  await page.locator("#customiser-start").click();
  await expect(page.locator(".tat-root")).toHaveCount(1);

  const before = await page.locator(".tat-tooltip").boundingBox();
  await page.locator("#width").fill("440");
  await page.waitForTimeout(200);
  const after = await page.locator(".tat-tooltip").boundingBox();

  expect(after.width).toBeGreaterThan(before.width);
});

test("every navigation link resolves to a real page", async ({ page }) => {
  await page.goto("/");

  const links = await page.locator(".sidebar a").all();
  expect(links.length).toBeGreaterThanOrEqual(20);

  for (const link of links) {
    const href = await link.getAttribute("href");
    const response = await page.request.get(href);
    expect(response.status(), `${href} should resolve`).toBe(200);
  }
});
