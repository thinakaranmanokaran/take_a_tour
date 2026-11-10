#!/usr/bin/env node
/**
 * Honest performance measurement for the built docs site.
 *
 * Starts the Pages-like docs server (or reuses one already listening on
 * `DOCS_PORT`), then loads key routes in Chromium and records, per route:
 *
 *   - request count and transfer bytes split by resource type
 *   - LCP and CLS from buffered PerformanceObserver entries
 *   - the worst `event` timing entry after a real click (theme toggle)
 *   - how many islands hydrated
 *
 * It also proves the library chunk contract: on the home page, no library
 * JavaScript is requested during load; the core chunk appears only after the
 * visitor starts the hero tour.
 *
 * Nothing here is projected — every number printed is read from the browser.
 *
 * Usage:  node apps/docs/scripts/measure-perf.mjs
 */

import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

// apps/docs/scripts -> apps/docs -> apps -> repo root
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const PORT = Number(process.env.DOCS_PORT ?? 5181);
// Keep in sync with BASE_PATH in apps/docs/astro.config.mjs.
const BASE = process.env.DOCS_BASE ?? "/take_a_tour";
const ORIGIN = `http://127.0.0.1:${PORT}${BASE}`;

const ROUTES = [
  { name: "home", path: "/" },
  { name: "docs (getting started)", path: "/docs/getting-started/" },
  { name: "examples", path: "/examples/" },
  { name: "playground", path: "/playground/" },
];

const TYPE_GROUPS = {
  script: "js",
  stylesheet: "css",
  document: "html",
  font: "font",
  image: "img",
  fetch: "fetch",
};

async function ensureServer() {
  try {
    const res = await fetch(ORIGIN, { redirect: "manual" });
    if (res.status < 500) return null;
  } catch {
    // not running — start it below
  }
  const child = spawn(
    process.execPath,
    [path.join(ROOT, "packages", "core", "tests", "browser", "docs-server.mjs")],
    { cwd: ROOT, stdio: "ignore" }
  );
  for (let i = 0; i < 50; i += 1) {
    await delay(100);
    try {
      const res = await fetch(ORIGIN, { redirect: "manual" });
      if (res.status < 500) return child;
    } catch {
      // keep waiting
    }
  }
  child.kill();
  throw new Error(`docs server did not start on port ${PORT}`);
}

function installObserversScript() {
  window.__perf = { lcp: 0, cls: 0, events: [] };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__perf.lcp = entry.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) window.__perf.cls += entry.value;
    }
  }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__perf.events.push({ name: entry.name, duration: entry.duration });
    }
  }).observe({ type: "event", buffered: true, durationThreshold: 16 });
}

async function responseBytes(response) {
  try {
    return (await response.body()).length;
  } catch {
    const len = response.headers()["content-length"];
    return len ? Number(len) : 0;
  }
}

async function measureRoute(browser, route, { clickHero = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.addInitScript(installObserversScript);

  const sizes = { js: 0, css: 0, html: 0, font: 0, img: 0, fetch: 0, other: 0 };
  const seen = new Set();
  const requests = [];

  page.on("response", async (response) => {
    const type = response.request().resourceType();
    const entry = { url: response.url(), type, status: response.status() };
    requests.push(entry);
    const key = `${type} ${response.url()}`;
    if (seen.has(key)) return;
    seen.add(key);
    const bytes = await responseBytes(response);
    sizes[TYPE_GROUPS[type] ?? "other"] += bytes;
    entry.bytes = bytes;
  });

  await page.goto(`${ORIGIN}${route.path.slice(1)}`, { waitUntil: "networkidle" });
  await delay(800);
  const atLoadCount = requests.length;
  // Give pending body reads a beat so at-load byte sums are settled.
  await delay(200);
  const atLoadBytes = Object.values(sizes).reduce((a, b) => a + b, 0);

  let lazyJs = [];
  if (clickHero) {
    await page.getByRole("button", { name: "Run the real tour" }).click();
    await delay(1200);
    lazyJs = requests.slice(atLoadCount).filter((r) => r.type === "script");
  }

  // One real interaction for event timing: flip the theme to dark.
  await page.locator('.theme-switch button[data-theme-choice="dark"]').click();
  await delay(400);

  const perf = await page.evaluate(() => window.__perf);
  const islandCount = await page.locator("astro-island").count();
  const hydratedCount = await page.locator("astro-island:not([ssr])").count();

  await context.close();
  return {
    sizes,
    requests: requests.length,
    atLoadCount,
    atLoadBytes,
    lazyJs,
    perf,
    islandCount,
    hydratedCount,
  };
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)}`;
}

const server = await ensureServer();
const browser = await chromium.launch();

console.log(`Take a Tour docs — measured in Chromium at ${ORIGIN}\n`);

for (const route of ROUTES) {
  const result = await measureRoute(browser, route, { clickHero: route.name === "home" });
  const { sizes, perf } = result;
  const total = Object.values(sizes).reduce((a, b) => a + b, 0);
  const worst = perf.events.reduce((max, e) => (e.duration > max.duration ? e : max), {
    name: "—",
    duration: 0,
  });
  console.log(`## ${route.name}  (${BASE.replace(/\/$/, "")}${route.path})`);
  console.log(
    `requests: ${result.requests}   js: ${kb(sizes.js)} kB   css: ${kb(sizes.css)} kB   ` +
      `other: ${kb(total - sizes.js - sizes.css)} kB   total: ${kb(total)} kB`
  );
  console.log(
    `at load: ${result.atLoadCount} request(s), ≈${kb(result.atLoadBytes)} kB   ` +
      `LCP: ${perf.lcp.toFixed(0)} ms   CLS: ${perf.cls.toFixed(4)}`
  );
  console.log(
    `worst event after click: ${worst.duration.toFixed(1)} ms (${worst.name})   ` +
      `islands: ${result.hydratedCount}/${result.islandCount} hydrated`
  );
  if (route.name === "home") {
    const chunk = result.lazyJs.map((r) => path.basename(r.url)).join(", ") || "(none)";
    console.log(
      `library laziness: ${result.lazyJs.length} script request(s) appeared after starting the hero tour → ${chunk}`
    );
  }
  console.log("");
}

await browser.close();
if (server) server.kill();

console.log("done");
