import { defineConfig, devices } from "@playwright/test";

/**
 * Real-browser test configuration.
 *
 * These tests exist because jsdom has no layout engine: `getBoundingClientRect`
 * returns zeros there, so placement, viewport overflow, scrolling and computed
 * styles simply cannot be verified without a browser.
 *
 * Chromium only. One engine is enough to prove the layout maths; adding more
 * would multiply runtime without testing new logic.
 */
export default defineConfig({
  testDir: "./tests/browser",
  // The docs suite needs a separate server and a prior docs build; it has its
  // own config (playwright.docs.config.js).
  testIgnore: "**/docs-*.spec.js",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [["list"], ["html", { outputFolder: "./playwright-report", open: "never" }]],
  timeout: 30_000,

  use: {
    baseURL: "http://127.0.0.1:5180",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    // The browser tests exercise the **built package**, served as a plain
    // static site, so nothing depends on a bundler being configured.
    command: "node tests/browser/server.mjs",
    url: "http://127.0.0.1:5180/health",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
