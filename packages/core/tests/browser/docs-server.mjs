/**
 * Static server for the built documentation site.
 *
 * Emulates how GitHub Pages serves this project site: everything lives under
 * the `/take_a_tour/` base path, directory URLs are canonical with a trailing
 * slash (the slashless form 301-redirects), and unknown paths under the base
 * return the built `404.html`.
 *
 * Dependency-free on purpose: the docs are plain static files, and the browser
 * tests should not need a download to prove they work.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

// packages/core/tests/browser -> packages/core/tests -> packages/core -> packages -> repo root
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const DIST = path.join(ROOT, "apps", "docs", "dist");
const PORT = Number(process.env.DOCS_PORT ?? 5181);

// Keep in sync with BASE_PATH in apps/docs/astro.config.mjs.
const BASE = process.env.DOCS_BASE ?? "/take_a_tour";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".xml": "application/xml",
  ".txt": "text/plain; charset=utf-8",
};

function isFile(info) {
  return info.isFile();
}

async function fileInfo(candidate) {
  if (!candidate.startsWith(DIST)) return null;
  try {
    const info = await stat(candidate);
    return isFile(info) ? info : null;
  } catch {
    return null;
  }
}

function sendFile(response, file, status = 200) {
  return readFile(file).then((body) => {
    response.writeHead(status, {
      "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(body);
  });
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  // Everything is served under the project base path.
  if (!pathname.startsWith(BASE)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end(`not found: the site is served under ${BASE}/`);
    return;
  }

  // `/take_a_tour` -> `/take_a_tour/` (GitHub Pages behaviour).
  if (pathname === BASE) {
    response.writeHead(301, { location: `${BASE}/` });
    response.end();
    return;
  }

  const relative = pathname.slice(BASE.length);
  const hasTrailingSlash = relative.endsWith("/");
  const trimmed = relative.replace(/\/+$/, "");

  // Exact file: assets, sitemap.xml, robots.txt, search-index.json, favicon.
  const fileCandidate = path.join(DIST, trimmed);
  if (await fileInfo(fileCandidate)) {
    await sendFile(response, fileCandidate);
    return;
  }

  // Directory route: `/take_a_tour/docs/getting-started/` -> `.../index.html`.
  const indexCandidate = path.join(DIST, trimmed, "index.html");
  if (await fileInfo(indexCandidate)) {
    if (!hasTrailingSlash) {
      // Canonical form is the trailing-slash URL; redirect like GitHub Pages.
      response.writeHead(301, { location: `${BASE}${trimmed}/` });
      response.end();
      return;
    }
    await sendFile(response, indexCandidate);
    return;
  }

  // Unknown path under the base: the built 404 page, with a 404 status.
  const notFound = path.join(DIST, "404.html");
  if (await fileInfo(notFound)) {
    await sendFile(response, notFound, 404);
    return;
  }

  response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
  response.end("not found");
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving the documentation site on http://127.0.0.1:${PORT}${BASE}/`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
