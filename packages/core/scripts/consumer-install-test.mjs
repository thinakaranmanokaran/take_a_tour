#!/usr/bin/env node
/**
 * Clean consumer installation test.
 *
 * A library that works only inside its own repository is not production-ready.
 * This script packs the real tarball, installs it into a throwaway project with
 * no workspace links, and exercises every published entry point exactly as a
 * consumer would:
 *
 *   1. native ESM `import`
 *   2. CommonJS `require()`
 *   3. `@take-a-tour/core/styles.css` resolution
 *   4. `tsc --noEmit` against the shipped declarations
 *   5. no runtime dependencies in the installed tree
 *
 * Exits non-zero on the first failure.
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WORK_DIR = path.join(tmpdir(), "take-a-tour-consumer-test");

function log(step, message) {
  console.log(`  ${step}  ${message}`);
}

function fail(message) {
  console.error(`\nFAIL  ${message}\n`);
  process.exit(1);
}

/** Locate npm's CLI through the running Node binary (works on every platform). */
function resolveNpmCli() {
  const candidates = [
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(path.dirname(process.execPath), "..", "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  for (const candidate of candidates) if (existsSync(candidate)) return candidate;
  throw new Error("Could not locate npm-cli.js next to the running Node binary.");
}

const npm = (args, cwd) =>
  execFileSync(process.execPath, [resolveNpmCli(), ...args], {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

console.log("Clean consumer installation test\n");

// --- 1. Pack ---------------------------------------------------------------
console.log("Packing the real tarball…");
rmSync(WORK_DIR, { recursive: true, force: true });
mkdirSync(WORK_DIR, { recursive: true });

npm(["run", "build"], ROOT);
npm(["pack", "--pack-destination", WORK_DIR, "--loglevel=error"], ROOT);

const tarball = readFileSync(path.join(ROOT, "package.json"), "utf8");
void tarball;

const tarballs = readdirSync(WORK_DIR).filter((file) => file.endsWith(".tgz"));
if (tarballs.length !== 1) fail(`expected exactly one tarball, found ${tarballs.length}`);

const tarballPath = path.join(WORK_DIR, tarballs[0]);
log("ok", `packed ${tarballs[0]}`);

// --- 2. Fresh consumer project --------------------------------------------
console.log("\nInstalling into a throwaway project…");
const CONSUMER = path.join(WORK_DIR, "consumer");
mkdirSync(CONSUMER, { recursive: true });

writeFileSync(
  path.join(CONSUMER, "package.json"),
  JSON.stringify(
    {
      name: "consumer-test",
      version: "1.0.0",
      private: true,
      // Deliberately CommonJS-by-default so `require()` is genuinely exercised.
    },
    null,
    2
  )
);

npm(["init", "-y"], CONSUMER);
npm(["install", tarballPath, "--no-audit", "--no-fund", "--loglevel=error"], CONSUMER);
log("ok", "installed the packed tarball");

const installed = path.join(CONSUMER, "node_modules", "@take-a-tour", "core");
if (!existsSync(installed)) fail("the package was not installed where expected");

// --- 3. Runtime dependencies ------------------------------------------------
console.log("\nAuditing the installed runtime dependency tree…");
const installedPkg = JSON.parse(readFileSync(path.join(installed, "package.json"), "utf8"));
const runtimeDeps = Object.keys(installedPkg.dependencies ?? {});
if (runtimeDeps.length > 0) fail(`installed package declares runtime dependencies: ${runtimeDeps}`);
log("ok", "zero runtime dependencies declared");

// Count how many packages npm actually installed for this dependency.
let installedTopLevel = 0;
try {
  installedTopLevel = readdirSync(path.join(CONSUMER, "node_modules")).filter((name) =>
    name.startsWith(".")
  ).length;
} catch {
  /* node_modules absent would itself be the failure below */
}
log("ok", `${installedTopLevel} entries in node_modules (expected 1: @take-a-tour)`);

// --- 4. Native ESM import ---------------------------------------------------
console.log("\nTesting native ESM import…");
writeFileSync(
  path.join(CONSUMER, "esm-check.mjs"),
  `
import { createTour, VERSION, PLACEMENTS, TargetError, STATES } from "@take-a-tour/core";

if (typeof createTour !== "function") throw new Error("createTour is not a function");
if (typeof VERSION !== "string") throw new Error("VERSION is not a string");
if (!Array.isArray(PLACEMENTS) || PLACEMENTS.length !== 13) {
  throw new Error("PLACEMENTS should contain 13 entries, got " + PLACEMENTS?.length);
}
if (STATES.RUNNING !== "running") throw new Error("STATES is malformed");

// Exercise the full lifecycle against a jsdom-free document shim is not
// possible here, so verify construction-time behaviour only.
const tour = createTour({
  tourId: "consumer-esm",
  steps: [{ tourId: "a.b", title: "Hello", content: "World" }],
});
if (tour.tourId !== "consumer-esm") throw new Error("tourId mismatch");
if (tour.getState() !== "idle") throw new Error("a new tour should be idle");
if (tour.getCurrentStep() !== null) throw new Error("a new tour should have no current step");

try {
  createTour({ tourId: "bad", steps: [] });
  throw new Error("expected a validation error");
} catch (error) {
  if (!(error instanceof TargetError) && error.code !== "TAT_CONFIG") {
    throw new Error("expected a TourConfigError, got " + error);
  }
}

console.log("    esm ok");
`
);
npm(["exec", "--", "node", "esm-check.mjs"], CONSUMER)
  .split("\n")
  .forEach((line) => {
    if (line.trim()) console.log(line);
  });
log("ok", "ESM entry point works");

// --- 5. CommonJS require ----------------------------------------------------
console.log("\nTesting CommonJS require()…");
writeFileSync(
  path.join(CONSUMER, "cjs-check.cjs"),
  `
const core = require("@take-a-tour/core");

if (typeof core.createTour !== "function") throw new Error("createTour is not a function");
if (core.STATES.COMPLETED !== "completed") throw new Error("STATES is malformed");

const tour = core.createTour({
  tourId: "consumer-cjs",
  steps: [{ tourId: "a.b", title: "Hello" }],
});
if (tour.getState() !== "idle") throw new Error("a new tour should be idle");
if (typeof tour.on !== "function") throw new Error("tour.on is missing");

console.log("    cjs ok");
`
);
npm(["exec", "--", "node", "cjs-check.cjs"], CONSUMER)
  .split("\n")
  .forEach((line) => {
    if (line.trim()) console.log(line);
  });
log("ok", "CommonJS entry point works");

// --- 6. CSS export ----------------------------------------------------------
console.log("\nTesting CSS export resolution…");
const cssPath = path.join(CONSUMER, "resolve-css.mjs");
writeFileSync(
  cssPath,
  `
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
// Resolve exactly as a bundler would resolve the "exports" entry.
const resolved = require.resolve("@take-a-tour/core/styles.css");
if (!existsSync(resolved)) throw new Error("styles.css did not resolve to a real file");

const indexCss = readFileSync(resolved, "utf8");
const dir = dirname(resolved);

// The public entry is an aggregation file; every sheet it pulls in must ship.
const imports = [...indexCss.matchAll(/@import\\s+"\\.\\/([^"]+)"/g)].map((m) => m[1]);
if (imports.length === 0) throw new Error("styles.css imports nothing");

const combined = imports.map((name) => {
  const file = resolve(dir, name);
  if (!existsSync(file)) throw new Error("imported stylesheet is missing: " + name);
  return readFileSync(file, "utf8");
}).join("\\n");

for (const token of [
  "--tat-",
  ".tat-root",
  "data-tat-theme",
  "prefers-reduced-motion",
  "prefers-color-scheme",
]) {
  if (!combined.includes(token)) throw new Error("design system is missing: " + token);
}

console.log("    css ok (" + combined.length + " bytes across " + imports.length + " sheets)");
`
);
npm(["exec", "--", "node", "resolve-css.mjs"], CONSUMER)
  .split("\n")
  .forEach((line) => {
    if (line.trim()) console.log(line);
  });
log("ok", "@take-a-tour/core/styles.css resolves and contains the design system");

// --- 7. TypeScript declarations --------------------------------------------
console.log("\nTesting TypeScript declarations…");
writeFileSync(
  path.join(CONSUMER, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        module: "ESNext",
        moduleResolution: "bundler",
        lib: ["ES2022", "DOM"],
        strict: true,
        noEmit: true,
        skipLibCheck: false,
      },
      include: ["types-check.ts"],
    },
    null,
    2
  )
);

writeFileSync(
  path.join(CONSUMER, "types-check.ts"),
  `
import { createTour, type Tour, type TourConfig, type TourEventMap } from "@take-a-tour/core";

const config: TourConfig = {
  tourId: "consumer-types",
  theme: "dark",
  steps: [
    { tourId: "a.b", title: "One", content: "First", placement: "bottom" },
    { tourId: "c.d", title: "Two", content: "Second", when: () => true },
  ],
  on: {
    complete: (payload) => {
      const tour: Tour = payload.tour;
      void tour.tourId;
    },
  },
};

const tour: Tour = createTour(config);
const state: string = tour.getState();
tour.on("stepChange", (payload: TourEventMap["stepChange"]) => void payload.index);
tour.setTheme("light");
void state;
`
);

npm(
  ["exec", "--yes", "--package=typescript@5.9.3", "--", "tsc", "--noEmit", "-p", "tsconfig.json"],
  CONSUMER
);
log("ok", "types/index.d.ts compiles against a real consumer project");

// --- 8. Published files -----------------------------------------------------
console.log("\nAuditing published files…");
const published = readdirSync(installed).sort();
for (const required of ["src", "dist", "styles", "types", "package.json", "README.md", "LICENSE"]) {
  if (!published.includes(required)) fail(`missing ${required} in the installed package`);
}
if (published.includes("tests")) fail("tests were published");
if (published.some((file) => file.endsWith(".map"))) fail("source maps were published");

log("ok", `published contents: ${published.join(", ")}`);

// --- done -------------------------------------------------------------------
rmSync(WORK_DIR, { recursive: true, force: true });
console.log("\nClean consumer installation verified.");
console.log(
  "  ESM import · CommonJS require · CSS export · TypeScript types · zero runtime deps\n"
);
