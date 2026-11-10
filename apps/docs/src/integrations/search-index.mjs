/**
 * Build-time extras, run after every `astro build`:
 *
 *  1. Writes an `id` onto every content heading that lacks one, using the
 *     same `slugify()` the TOC island uses — so fragments work before
 *     JavaScript runs, and the index links match the rendered anchors.
 *  2. Builds `search-index.json` from the rendered pages (titles, headings
 *     and section text), which `SearchDialog` fetches on first open.
 *  3. Writes `sitemap.xml`, `robots.txt` and `.nojekyll` for GitHub Pages.
 *
 * Everything is derived from the built HTML, so the index can never disagree
 * with the pages a visitor sees.
 */

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "../lib/slugify.js";

/** How much of a section's text goes into the index. */
const SECTION_CHAR_LIMIT = 600;

const NAMED_ENTITIES = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rarr: "→",
  larr: "←",
  times: "×",
  copy: "©",
};

function decodeEntities(value) {
  return value.replace(/&(#[0-9a-fx]+|[a-z]+);/gi, (match, code) => {
    if (code[0] === "#") {
      const hex = code[1]?.toLowerCase() === "x";
      const number = parseInt(hex ? code.slice(2) : code.slice(1), hex ? 16 : 10);
      return Number.isFinite(number) ? String.fromCodePoint(number) : match;
    }
    const named = NAMED_ENTITIES[code.toLowerCase()];
    return named ?? match;
  });
}

/** Visible text of an HTML fragment. */
function textOf(html) {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** Ranges of `<script>`/`<style>` content, which the heading pass skips. */
function ignoredRanges(html) {
  const ranges = [];
  const re = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

function uniqueSlug(text, used) {
  const base = slugify(text) || "section";
  let slug = base;
  let counter = 2;
  while (used.has(slug)) slug = `${base}-${counter++}`;
  used.add(slug);
  return slug;
}

function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Writes the current page's `h2` sections into the built site rail, nested
 * under the page's own link — so the links exist before JavaScript runs, the
 * no-JS page is fully navigable, and nothing shifts into place on hydration.
 * The island applies the same rule (two or more `h2`s) and renders the same
 * list, so hydration finds the DOM it expected.
 */
function injectSiteSections(html, h2s) {
  if (h2s.length < 2) return html;

  const nav = /<nav class="sidebar sidebar--site"[\s\S]*?<\/nav>/.exec(html);
  if (!nav) return html;

  const current = nav[0].indexOf('aria-current="page"');
  const anchorEnd = current === -1 ? -1 : nav[0].indexOf("</a>", current);
  if (anchorEnd === -1) return html;

  const items = h2s
    .map((entry) => `<li><a href="#${escapeHtml(entry.id)}">${escapeHtml(entry.heading)}</a></li>`)
    .join("");
  const at = nav.index + anchorEnd + "</a>".length;

  return `${html.slice(0, at)}<ul class="sidebar__sections">${items}</ul>${html.slice(at)}`;
}

/**
 * Adds missing heading ids and returns the page's searchable sections.
 * Only headings inside `<main>` are considered — sidebar, header and footer
 * text never enters the index.
 */
function processPage(html) {
  const mainStart = html.indexOf("<main");
  const scopeStart = mainStart === -1 ? 0 : mainStart;
  const mainEnd = html.indexOf("</main>", scopeStart);
  const scopeEnd = mainEnd === -1 ? html.length : mainEnd;

  const script = ignoredRanges(html).filter(([start]) => start < scopeEnd);

  const headingRe = /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g;
  const headings = [];
  let match;
  while ((match = headingRe.exec(html)) !== null) {
    if (match.index >= scopeEnd) break;
    if (script.some(([start, end]) => match.index >= start && match.index < end)) continue;
    headings.push(match);
  }

  const used = new Set();
  const sections = [];
  const h2s = [];
  let out = "";
  // `out` starts at the top of the document: everything before the first
  // heading (head, header, main opening tag) must survive the rewrite.
  let last = 0;

  for (let index = 0; index < headings.length; index++) {
    const current = headings[index];
    const [full, level, attributes, inner] = current;
    const existing = /\bid="([^"]*)"/.exec(attributes);
    const heading = textOf(inner);
    const id = existing ? existing[1] : uniqueSlug(heading, used);
    if (existing) used.add(id);

    out += html.slice(last, current.index);
    out += existing ? full : `<h${level} id="${id}"${attributes}>${inner}</h${level}>`;
    last = current.index + full.length;

    const sectionEnd = index + 1 < headings.length ? headings[index + 1].index : scopeEnd;
    sections.push({
      id,
      heading,
      text: textOf(html.slice(last, sectionEnd)).slice(0, SECTION_CHAR_LIMIT),
    });
    if (level === "2") h2s.push({ id, heading });
  }

  out += html.slice(last);

  // The lede between the page title and the first section heading.
  const h1 = /<h1[^>]*>[\s\S]*?<\/h1>/.exec(html.slice(0, headings[0]?.index ?? scopeEnd));
  if (h1) {
    const introStart = h1.index + h1[0].length;
    const introEnd = headings[0]?.index ?? scopeEnd;
    const intro = textOf(html.slice(introStart, introEnd));
    if (intro)
      sections.unshift({ id: null, heading: "", text: intro.slice(0, SECTION_CHAR_LIMIT) });
  }

  return { html: out, sections, h2s };
}

function pageTitle(html) {
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
  if (h1) return textOf(h1[1]);
  const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(html);
  return title ? textOf(title[1]).replace(/\s+—\s+Take a Tour$/, "") : "Take a Tour";
}

function walk(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

export function searchIndex({ site = "", base = "/" } = {}) {
  const origin = site.replace(/\/+$/, "");
  const prefix = base.startsWith("/") ? base : `/${base}`;
  const basePath = prefix.endsWith("/") ? prefix : `${prefix}/`;

  return {
    name: "take-a-tour:build-extras",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);
        const pages = walk(root)
          .filter((file) => file.endsWith(`${sep}index.html`))
          .sort();

        const index = { pages: [] };

        for (const file of pages) {
          const original = readFileSync(file, "utf8");
          const { html, sections, h2s } = processPage(original);
          const built = injectSiteSections(html, h2s);
          if (built !== original) writeFileSync(file, built);

          const href =
            "/" +
            relative(root, file)
              .split(sep)
              .join("/")
              .replace(/index\.html$/, "");
          index.pages.push({ href, title: pageTitle(original), sections });
        }

        index.pages.sort((a, b) => a.href.localeCompare(b.href));

        writeFileSync(join(root, "search-index.json"), `${JSON.stringify(index)}\n`);

        const urls = index.pages
          .map(
            (page) => `  <url><loc>${origin}${basePath}${page.href.replace(/^\//, "")}</loc></url>`
          )
          .join("\n");
        writeFileSync(
          join(root, "sitemap.xml"),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
        );

        writeFileSync(
          join(root, "robots.txt"),
          `User-agent: *\nAllow: /\n\nSitemap: ${origin}${basePath}sitemap.xml\n`
        );

        // GitHub Pages runs Jekyll unless this file exists; Jekyll would drop
        // directories that start with an underscore (like `_astro/`).
        writeFileSync(join(root, ".nojekyll"), "");

        const headingCount = index.pages.reduce((total, page) => total + page.sections.length, 0);
        console.log(
          `[build-extras] ${index.pages.length} pages, ${headingCount} sections indexed; sitemap, robots.txt and .nojekyll written`
        );
      },
    },
  };
}
