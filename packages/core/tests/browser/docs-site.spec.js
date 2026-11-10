import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Site-level tests for the built documentation site.
 *
 * These run against the static output served with GitHub Pages semantics
 * (`docs-server.mjs`), so everything they prove — server-rendered heading ids,
 * the search index, the 404 page, the hydrated islands — holds on the real
 * deployment too.
 */

/**
 * Waits until the island containing `selector` has hydrated. Astro removes the
 * `ssr` attribute from `<astro-island>` once the client runtime has taken over,
 * which is the only reliable signal — Playwright's actionability checks do not
 * know about hydration.
 */
async function waitForIsland(page, selector) {
  await page.waitForFunction((target) => {
    const island = [...document.querySelectorAll("astro-island")].find(
      (el) => el.querySelector(target) || el.closest(target)
    );
    return Boolean(island) && !island.hasAttribute("ssr");
  }, selector);
}

test("the landing page runs a real tour from the hero", async ({ page }) => {
  await page.goto("/take_a_tour/");

  await expect(page).toHaveTitle(/Take a Tour/);
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator(".hero__demo")).toBeVisible();

  await waitForIsland(page, ".hero__demo");
  await page.locator(".hero__demo .demo-controls button").first().click();

  await expect(page.locator(".tat-root")).toHaveCount(1);
  await expect(page.locator(".tat-tooltip__title")).toHaveText("Real elements, measured live");
});

test("an example panel runs its own configuration", async ({ page }) => {
  await page.goto("/take_a_tour/examples/");

  const example = page.locator("#example-basic");
  await example.scrollIntoViewIfNeeded();
  await expect(example.locator("[data-tour-id='ex.basic.nav']")).toBeVisible();

  await waitForIsland(page, "#example-basic");
  await example.locator(".demo-controls button").first().click();

  await expect(page.locator(".tat-tooltip__title")).toHaveText("Your overview");
  await expect(example.locator(".demo-status")).toContainText("Step 1 of 3");
});

test("Ctrl+K search finds a heading and opens its anchor", async ({ page }) => {
  await page.goto("/take_a_tour/");
  await waitForIsland(page, ".site-header");

  await page.keyboard.press("Control+k");
  const dialog = page.locator("#search-dialog");
  await expect(dialog).toBeVisible();

  // The combobox pattern: the input owns focus and the active option.
  await expect(page.locator("#search-input")).toHaveAttribute("role", "combobox");

  await page.locator("#search-input").fill("prefers-color-scheme");
  const first = page.locator(".search-result").first();
  await expect(first).toBeVisible();

  const href = await first.getAttribute("href");
  expect(href).toMatch(/^\/take_a_tour\/docs\/.+#.+/);

  await page.keyboard.press("Enter");
  await page.waitForURL(`**${href}`);

  // The heading the index pointed at is in the served HTML (ids are written
  // at build time, before any JavaScript runs).
  const fragment = new URL(page.url()).hash;
  expect(fragment.length).toBeGreaterThan(1);
  await expect(page.locator(fragment)).toBeAttached();
});

test("the theme switch applies immediately and survives a reload", async ({ page }) => {
  await page.goto("/take_a_tour/docs/");
  await waitForIsland(page, ".theme-switch");

  await page.locator('.theme-switch button[data-theme-choice="dark"]').first().click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // Reset for the following tests? Each test gets a fresh context, so this
  // storage state never leaks.
});

test("documentation pages ship heading ids and a working table of contents", async ({ page }) => {
  await page.goto("/take_a_tour/docs/configuration/");

  await expect(page.locator(".breadcrumbs")).toContainText(/configuration/i);
  await expect(page.locator(".sidebar")).toBeVisible();

  const serverRendered = await page.locator("#content h2[id], #content h3[id]").count();
  expect(serverRendered).toBeGreaterThan(3);

  // The TOC island lists headings and every link resolves to a real element.
  await page.waitForSelector(".toc a");
  const fragments = await page
    .locator(".toc a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(fragments.length).toBeGreaterThan(3);
  for (const fragment of fragments) {
    expect(await page.locator(`#content [id="${fragment.slice(1)}"]`).count()).toBe(1);
  }
});

test("unknown paths render the designed 404 page with a 404 status", async ({ page }) => {
  const response = await page.goto("/take_a_tour/this-page-does-not-exist/");

  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toContainText("not on the tour");
  await expect(page.locator('.notfound__actions a[href="/take_a_tour/"]')).toBeVisible();
  await expect(
    page.locator('.notfound__actions a[href="/take_a_tour/docs/getting-started/"]')
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
});

test("the skip link is the first focus stop on every page", async ({ page }) => {
  await page.goto("/take_a_tour/docs/api/");

  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#content");
});

test("the mobile menu opens, closes with Escape, and navigates", async ({ page }) => {
  await page.setViewportSize({ width: 480, height: 820 });
  await page.goto("/take_a_tour/");
  await waitForIsland(page, ".nav-toggle");

  const toggle = page.locator(".nav-toggle");
  await expect(toggle).toBeVisible();

  await toggle.click();
  const menu = page.locator("#mobile-nav");
  await expect(menu).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  await page.keyboard.press("Escape");
  await expect(page.locator("#mobile-nav")).toHaveCount(0);

  await toggle.click();
  await menu.locator('a[href="/take_a_tour/docs/"]').click();
  await page.waitForURL("**/take_a_tour/docs/");
  await expect(page.locator(".sidebar")).toBeVisible();
});

/** Serious/critical axe violations for the page as it currently stands. */
async function accessibilityViolations(page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  return results.violations
    .filter((violation) => ["serious", "critical"].includes(violation.impact))
    .map((violation) => `${violation.id}: ${violation.nodes.length} node(s)`);
}

test("key pages have no serious or critical accessibility violations", async ({ page }) => {
  // Eight full axe scans plus their navigations do not fit the default 30s
  // once the pages carry real content; the assertions are unchanged.
  test.setTimeout(120_000);

  // One axe pass per page shape — landing, documentation, playground, 404 —
  // in both themes, since the palette changes with `data-theme`.
  const paths = [
    "/take_a_tour/",
    "/take_a_tour/docs/api/",
    "/take_a_tour/playground/",
    "/take_a_tour/this-page-does-not-exist/",
  ];

  for (const path of paths) {
    await page.goto(path);
    await waitForIsland(page, ".site-header");
    expect(await accessibilityViolations(page), `${path} (light theme)`).toEqual([]);

    await page.evaluate(() => localStorage.setItem("tat-docs-theme", "dark"));
    await page.reload();
    await waitForIsland(page, ".site-header");
    expect(await accessibilityViolations(page), `${path} (dark theme)`).toEqual([]);
  }
});

test.describe("with prefers-reduced-motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("tours still start and are visible", async ({ page }) => {
    await page.goto("/take_a_tour/playground/");
    await page.waitForFunction(() => typeof window.playground?.getState === "function");

    await page.locator("#pg-start").click();

    await expect(page.locator(".tat-root")).toHaveCount(1);
    await expect(page.locator(".tat-tooltip")).toBeVisible();
  });
});
