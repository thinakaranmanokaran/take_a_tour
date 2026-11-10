import { defineConfig, devices } from "@playwright/test";

/**
 * Documentation-site tests.
 *
 * The point of this suite is to prove the playground is not a mockup: it starts
 * a tour through the docs UI and asserts a real `.tat-root` appears in the page,
 * with real geometry around a real target. That cannot pass against a separate
 * implementation.
 *
 * Run `npm run docs:build` first.
 */
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "**/docs-*.spec.js",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  timeout: 30_000,

  use: {
    // Full base path: absolute `/…` paths passed to `page.goto()` resolve
    // against the origin and would otherwise drop `/take_a_tour`.
    baseURL: "http://127.0.0.1:5181/take_a_tour/",
    trace: "retain-on-failure",
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],

  webServer: {
    // Serves apps/docs/dist directly. The build must already have run.
    command: "node tests/browser/docs-server.mjs",
    url: "http://127.0.0.1:5181/take_a_tour/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
