#!/usr/bin/env node
/**
 * Build the CommonJS entry point.
 *
 * The ESM source is published as-is: it is already browser-compatible, fully
 * tree-shakeable, and needs no transpilation. Only a CJS bundle is generated,
 * for `require()` consumers.
 *
 * The `.cjs` extension matters — the package is `"type": "module"`, so a
 * `.js` file here would be parsed as ESM and `require()` would fail.
 */

import { build } from "esbuild";
import { rm, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "dist");
const OUT_FILE = path.join(OUT_DIR, "index.cjs");

const shared = {
  entryPoints: [path.join(ROOT, "src", "index.js")],
  bundle: true,
  format: "cjs",
  platform: "browser",
  target: ["es2022"],
  sourcemap: true,
  legalComments: "inline",
  // Nothing in this package depends on Node builtins at runtime.
  external: [],
  logLevel: "info",
};

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  console.log("Building CommonJS bundle…");
  await build({ ...shared, outfile: OUT_FILE });

  console.log("Building minified CommonJS bundle…");
  await build({ ...shared, outfile: path.join(OUT_DIR, "index.min.cjs"), minify: true });

  console.log("Done. ESM remains the published default at ./src/index.js");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
