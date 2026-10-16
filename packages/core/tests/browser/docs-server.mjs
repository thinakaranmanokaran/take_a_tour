/**
 * Static server for the built documentation site.
 *
 * Dependency-free on purpose: the docs are plain static files, and the browser
 * test should not need a download to prove they work.
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
};

async function resolveFile(pathname) {
  // Astro emits `build.format: "directory"`, so /guide -> /guide/index.html
  const candidates = [
    path.join(DIST, pathname),
    path.join(DIST, pathname, "index.html"),
    path.join(DIST, `${pathname}.html`),
  ];

  for (const candidate of candidates) {
    if (!candidate.startsWith(DIST)) continue;
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const file = await resolveFile(decodeURIComponent(url.pathname));

  if (!file) {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
    return;
  }

  try {
    const body = await readFile(file);
    response.writeHead(200, {
      "content-type": MIME[path.extname(file)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(500).end("error");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Serving the documentation site on http://127.0.0.1:${PORT}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
