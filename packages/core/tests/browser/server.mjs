/**
 * Static file server for the browser tests.
 *
 * Deliberately dependency-free and bundler-free: it serves the library's real
 * `src/` modules and real stylesheets to the browser. If the tests pass here,
 * the library works the same way it would for someone using an import map.
 */

import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC = path.join(ROOT, "tests", "browser", "fixtures");
const PORT = Number(process.env.PORT ?? 5180);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".cjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (url.pathname === "/health") {
    response.writeHead(200, { "content-type": "text/plain" });
    response.end("ok");
    return;
  }

  // `/lib/*` maps to the real published source, unchanged.
  let filePath;
  if (url.pathname.startsWith("/lib/")) {
    const relative = url.pathname.slice("/lib/".length);
    filePath = path.join(ROOT, relative);
    if (!filePath.startsWith(ROOT)) {
      response.writeHead(403).end("forbidden");
      return;
    }
  } else {
    const relative = url.pathname === "/" ? "/index.html" : url.pathname;
    filePath = path.join(PUBLIC, relative);
    if (!filePath.startsWith(PUBLIC)) {
      response.writeHead(403).end("forbidden");
      return;
    }
  }

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) throw new Error("directory");
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream",
      "cache-control": "no-store",
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain" });
    response.end("not found");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
  console.log(`Serving @take-a-tour/core ${pkg.version} fixtures on http://127.0.0.1:${PORT}`);
  if (!existsSync(path.join(ROOT, "src", "index.js"))) {
    console.error("  WARNING: packages/core/src is missing");
  }
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
