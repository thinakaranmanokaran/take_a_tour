#!/usr/bin/env node
/**
 * Runtime dependency + source hygiene audit for the published core package.
 *
 * The zero-dependency guarantee is the central architectural constraint of this
 * library. Comments and intent are not enough, so this script enforces it:
 *
 *   1. `packages/core/package.json` declares no runtime dependencies.
 *   2. Every module specifier in `src/` is either relative or a `node:` builtin.
 *   3. No forbidden APIs appear in `src/` (network access, eval, innerHTML).
 *
 * Exits non-zero with a readable report when any check fails, so it can gate CI.
 */

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { builtinModules } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CORE = path.join(ROOT, "packages", "core");
const SRC = path.join(CORE, "src");

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

/** Recursively collect every .js/.mjs file under a directory. */
async function collectJsFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectJsFiles(full)));
    } else if (/\.(js|mjs)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Strip comments and string bodies that could produce false matches.
 *
 * JSDoc examples legitimately contain `import` statements and code that the
 * library itself must never contain. Only real source should be scanned.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "))
    .replace(
      /(^|[^:"'`\\])\/\/[^\n]*/g,
      (match, prefix) => prefix + " ".repeat(match.length - prefix.length)
    );
}

/**
 * Extract module specifiers from import/export/require syntax.
 * Only string literals in module positions are considered.
 */
function extractSpecifiers(source) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:[\s\S]*?\bfrom\s*)?["']([^"']+)["']/g,
    /\bexport\s+(?:[\s\S]*?\bfrom\s*)["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source)) !== null) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

const FORBIDDEN_PATTERNS = [
  { pattern: /\bfetch\s*\(/, label: "fetch(", reason: "network access" },
  { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest", reason: "network access" },
  { pattern: /\bnavigator\.sendBeacon\b/, label: "sendBeacon", reason: "network access" },
  { pattern: /(^|[^.\w])eval\s*\(/, label: "eval(", reason: "dynamic code execution" },
  { pattern: /new\s+Function\s*\(/, label: "new Function(", reason: "dynamic code execution" },
  {
    pattern: /\.innerHTML\s*=/,
    label: ".innerHTML =",
    reason: "unsafe HTML injection (use textContent)",
  },
  {
    pattern: /\.outerHTML\s*=/,
    label: ".outerHTML =",
    reason: "unsafe HTML injection (use textContent)",
  },
  {
    pattern: /insertAdjacentHTML\s*\(/,
    label: "insertAdjacentHTML(",
    reason: "unsafe HTML injection",
  },
  { pattern: /document\.write\s*\(/, label: "document.write(", reason: "unsafe HTML injection" },
];

/** Lines allowed to reference innerHTML, with the reason they are safe. */
const INNERHTML_ALLOWLIST = new Map([
  [
    path.join(SRC, "components", "content", "unsafe-html.js"),
    "The single, explicitly named trusted-HTML escape hatch. Guarded by opt-in config and documented in SECURITY.md.",
  ],
]);

async function main() {
  // ---- 1. Package manifest ------------------------------------------------
  const pkgPath = path.join(CORE, "package.json");
  if (!existsSync(pkgPath)) {
    fail("packages/core/package.json not found — run this from the repository root.");
  } else {
    const pkg = JSON.parse(await readFile(pkgPath, "utf8"));
    const deps = Object.keys(pkg.dependencies ?? {});
    const peer = Object.keys(pkg.peerDependencies ?? {});
    const optional = Object.keys(pkg.optionalDependencies ?? {});

    if (deps.length) fail(`packages/core declares runtime dependencies: ${deps.join(", ")}`);
    if (peer.length) fail(`packages/core declares peer dependencies: ${peer.join(", ")}`);
    if (optional.length)
      fail(`packages/core declares optional dependencies: ${optional.join(", ")}`);
    if (!deps.length && !peer.length && !optional.length) {
      notes.push("package.json: zero runtime, peer and optional dependencies");
    }
  }

  // ---- 2 & 3. Source scanning -------------------------------------------
  const files = await collectJsFiles(SRC);
  if (!files.length) {
    fail("No source files found under packages/core/src.");
    report();
    return;
  }

  const builtins = new Set(builtinModules);
  let importCount = 0;

  for (const file of files) {
    const rel = path.relative(ROOT, file);
    const source = await readFile(file, "utf8");
    const code = stripComments(source);
    const lines = code.split(/\r?\n/);

    // 2. module specifiers
    for (const specifier of extractSpecifiers(code)) {
      importCount += 1;
      const isRelative = specifier.startsWith(".") || specifier.startsWith("/");
      const isNodeBuiltin = specifier.startsWith("node:") || builtins.has(specifier);
      if (!isRelative && !isNodeBuiltin) {
        fail(
          `${rel}: imports bare specifier "${specifier}" — this would become a runtime dependency.`
        );
      }
    }

    // 3. forbidden APIs
    for (const { pattern, label, reason } of FORBIDDEN_PATTERNS) {
      lines.forEach((line, index) => {
        if (!pattern.test(line)) return;
        if (line.trim() === "") return;
        const allowance = INNERHTML_ALLOWLIST.get(file);
        if (allowance && label.includes("innerHTML")) return;
        fail(`${rel}:${index + 1}: ${label} — ${reason}.`);
      });
    }
  }

  notes.push(`scanned ${files.length} source files, ${importCount} module specifiers`);
  for (const [, reason] of INNERHTML_ALLOWLIST) {
    notes.push(`allowlisted trusted-HTML module: ${reason}`);
  }

  report();
}

function report() {
  console.log("Runtime dependency audit — @take-a-tour/core\n");
  for (const note of notes) console.log(`  ok  ${note}`);
  if (failures.length) {
    console.error("");
    for (const failure of failures) console.error(`  FAIL  ${failure}`);
    console.error(`\n${failures.length} problem(s) found.`);
    process.exit(1);
  }
  console.log("\nZero runtime dependencies confirmed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// `stat` is imported for future use by the tree-shakeability check.
void stat;
