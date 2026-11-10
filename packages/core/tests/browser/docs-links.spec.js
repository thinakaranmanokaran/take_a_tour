import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "@playwright/test";

/**
 * Build-integrity crawl over the generated HTML.
 *
 * The site is deployed as a GitHub Pages *project* site, so every internal
 * link must carry the `/take_a_tour` prefix and every `#fragment` must point at
 * an id that exists in the served HTML (the build writes heading ids before any
 * JavaScript runs). Both classes of mistake are invisible in local dev, which
 * is exactly why this test reads the built files instead of the dev server.
 */

const here = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(here, "../../../../apps/docs/dist");
const BASE = "/take_a_tour";

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const htmlFiles = existsSync(DIST) ? walk(DIST).filter((file) => file.endsWith(".html")) : [];

function idsIn(html) {
  return new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
}

test("the build produced pages to crawl", () => {
  // `npm run docs:build` must have run before this suite.
  expect(htmlFiles.length).toBeGreaterThanOrEqual(25);
});

test("every internal link and fragment resolves under the base path", () => {
  const cache = new Map();
  const read = (file) => {
    if (!cache.has(file)) cache.set(file, readFileSync(file, "utf8"));
    return cache.get(file);
  };

  const problems = [];

  for (const file of htmlFiles) {
    const html = read(file);
    const pageIds = idsIn(html);

    for (const match of html.matchAll(/<a\s[^>]*href="([^"]*)"/g)) {
      const href = match[1];

      // Off-site links are not this test's business.
      if (
        !href ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("mailto:")
      ) {
        continue;
      }

      // A bare fragment stays on the current page.
      if (href.startsWith("#")) {
        const id = href.slice(1);
        if (id && !pageIds.has(id)) problems.push(`${file}: "${href}" has no matching id`);
        continue;
      }

      if (href !== BASE && !href.startsWith(`${BASE}/`)) {
        problems.push(`${file}: "${href}" is missing the ${BASE} base path`);
        continue;
      }

      const [pathPart, fragment] = href.slice(BASE.length).split("#");

      // Directory routes resolve to their index.html; file links must exist.
      const target =
        pathPart === "" || pathPart.endsWith("/") || !pathPart.split("/").pop().includes(".")
          ? join(DIST, pathPart, "index.html")
          : join(DIST, pathPart);

      if (!existsSync(target)) {
        problems.push(`${file}: "${href}" points at a missing file`);
        continue;
      }

      if (fragment) {
        const ids = pathPart === "" ? pageIds : idsIn(read(target));
        if (!ids.has(fragment)) problems.push(`${file}: "${href}" has no matching id in ${target}`);
      }
    }
  }

  expect(
    problems,
    `${problems.length} broken link(s):\n${problems.slice(0, 20).join("\n")}`
  ).toEqual([]);
});
