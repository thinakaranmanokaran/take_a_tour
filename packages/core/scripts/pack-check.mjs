#!/usr/bin/env node
/**
 * Package contents audit.
 *
 * `npm pack --dry-run` lists what would be published. This script turns that
 * list into a pass/fail check so an accidental test file, fixture, editor
 * config or source map can never ship by being added quietly.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Paths that must never appear in the tarball. */
const FORBIDDEN_PATTERNS = [
  { pattern: /(^|\/)tests?\//, label: "test files" },
  { pattern: /\.test\.[cm]?[jt]s$/, label: "test files" },
  { pattern: /\.spec\.[cm]?[jt]s$/, label: "spec files" },
  { pattern: /(^|\/)playwright-report\//, label: "playwright report" },
  { pattern: /(^|\/)coverage\//, label: "coverage output" },
  { pattern: /(^|\/)node_modules\//, label: "node_modules" },
  { pattern: /^\.env/, label: "environment file" },
  { pattern: /(tsconfig|vitest\.config|eslint\.config|prettier)/, label: "tooling config" },
  { pattern: /\.map$/, label: "source map" },
  { pattern: /(^|\/)\.git/, label: "git metadata" },
];

/** Paths that must be present. */
const REQUIRED_PATTERNS = [
  { pattern: /^package\.json$/, label: "package.json" },
  { pattern: /^src\/index\.js$/, label: "ESM entry" },
  { pattern: /^dist\/index\.cjs$/, label: "CommonJS entry" },
  { pattern: /^styles\/index\.css$/, label: "public stylesheet" },
  { pattern: /^types\/index\.d\.ts$/, label: "TypeScript declarations" },
  { pattern: /^README\.md$/, label: "README" },
  { pattern: /^LICENSE$/, label: "LICENSE" },
];

/**
 * Locate npm's CLI entry point.
 *
 * `npm` on PATH is a shell script (POSIX) or a `.cmd` shim (Windows), neither
 * of which spawns directly. Invoking the CLI through the current Node binary
 * avoids both problems and does not need `shell: true`.
 */
function resolveNpmCli() {
  const candidates = [
    path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    path.join(path.dirname(process.execPath), "..", "node_modules", "npm", "bin", "npm-cli.js"),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error("Could not locate npm-cli.js next to the running Node binary.");
}

function listTarball() {
  const output = execFileSync(
    process.execPath,
    [resolveNpmCli(), "pack", "--dry-run", "--json", "--loglevel=error"],
    { cwd: ROOT, encoding: "utf8" }
  );
  const parsed = JSON.parse(output);
  return parsed[0].files.map((file) => file.path);
}

async function main() {
  const files = listTarball();
  const problems = [];

  console.log(`Package contents audit — @take-a-tour/core\n  ${files.length} files\n`);

  for (const file of files) {
    const normalised = file.replace(/\\/g, "/");
    for (const { pattern, label } of FORBIDDEN_PATTERNS) {
      if (pattern.test(normalised)) problems.push(`${normalised} — ${label} must not be published`);
    }
  }

  for (const { pattern, label } of REQUIRED_PATTERNS) {
    if (!files.some((file) => pattern.test(file.replace(/\\/g, "/")))) {
      problems.push(`missing ${label} (expected ${pattern})`);
    }
  }

  const pkg = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));
  if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
    problems.push("package.json declares runtime dependencies");
  }

  if (problems.length) {
    console.error("Problems:");
    for (const problem of problems) console.error(`  FAIL  ${problem}`);
    console.error(`\n${problems.length} problem(s) found.`);
    process.exit(1);
  }

  console.log("  ok  no test files, fixtures, tooling config or source maps");
  console.log("  ok  ESM entry, CJS entry, CSS, types, README and LICENSE are present");
  console.log("\nPackage contents are correct.");
}

await main();
