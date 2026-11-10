/**
 * Generates the social card (`public/og.png`, 1200×630) and the iOS home
 * screen icon (`public/apple-touch-icon.png`, 180×180).
 *
 * There is no image library in this repo, and there should not be one: the
 * site already ships Playwright for browser tests, so the card is designed as
 * ordinary HTML/CSS and rasterised with the same Chromium the test suite uses.
 *
 * The three self-hosted families (see global.css) are embedded as data URIs so
 * the rasterised card speaks the site's real typography.
 *
 * Run with:
 *
 *   npm run og:generate
 *
 * The PNGs are committed, so builds and CI never need to run this.
 */

import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const fontDir = join(root, "..", "..", "node_modules", "@fontsource-variable");

const face = (family, file) => `@font-face {
  font-family: "${family}";
  font-weight: 200 800;
  font-style: normal;
  src: url(data:font/woff2;base64,${readFileSync(join(fontDir, file)).toString("base64")})
    format("woff2-variations");
}`;

const FACES = [
  face(
    "Bricolage Grotesque Variable",
    "bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2"
  ),
  face("Geist Variable", "geist/files/geist-latin-wght-normal.woff2"),
  face("JetBrains Mono Variable", "jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2"),
].join("\n");

const DISPLAY = '"Bricolage Grotesque Variable", ui-sans-serif, system-ui, sans-serif';
const FONT = '"Geist Variable", ui-sans-serif, system-ui, "Segoe UI", Roboto, sans-serif';
const MONO = '"JetBrains Mono Variable", ui-monospace, Menlo, Consolas, monospace';

const card = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  ${FACES}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    font-family: ${FONT};
    background: #f9f7f3;
    color: #202020;
    position: relative;
  }
  /* Warm corner washes, echoing the site's hero band. */
  .wash {
    position: absolute; inset: 0;
    background:
      radial-gradient(46rem 26rem at 96% -8%, rgb(234 40 4 / 0.1), transparent 62%),
      radial-gradient(30rem 20rem at -6% 108%, rgb(244 168 160 / 0.22), transparent 66%);
  }
  .content {
    position: relative; display: flex; justify-content: space-between;
    align-items: center; gap: 48px; height: 100%; padding: 64px 72px 88px;
  }
  .left { max-width: 640px; }
  .brand { display: flex; align-items: center; gap: 14px; margin-bottom: 34px; }
  .brand-mark {
    width: 46px; height: 46px; border-radius: 12px;
    background: #d42300; color: #ffffff;
    display: grid; place-items: center;
    font-family: ${DISPLAY}; font-weight: 800; font-size: 25px;
  }
  .brand-name { font-family: ${DISPLAY}; font-size: 25px; font-weight: 700; letter-spacing: -0.01em; }
  h1 { font-family: ${DISPLAY}; font-size: 62px; line-height: 1; letter-spacing: -0.03em; font-weight: 700; }
  h1 .accent { color: #d42300; }
  .sub { margin-top: 22px; font-size: 22px; line-height: 1.45; color: #575757; }
  .chips { display: flex; gap: 12px; margin-top: 30px; }
  .chip {
    padding: 9px 16px; font-size: 16px; font-weight: 600; color: #202020;
    background: #f3f0e8; border: 1px solid rgb(32 32 32 / 0.12); border-radius: 999px;
  }
  .url { position: absolute; left: 72px; bottom: 42px; font-family: ${MONO}; font-size: 17px; color: #646464; }
  .url b { color: #202020; font-weight: 600; }
  /* The mock tooltip: this is what the library renders, in the site's orange. */
  .tooltip {
    width: 356px; border-radius: 12px; background: #ffffff; color: #202020;
    border: 1px solid rgb(32 32 32 / 0.12);
    box-shadow: 0 32px 64px -20px rgb(32 32 32 / 0.35);
    padding: 22px; position: relative;
  }
  .tooltip::before {
    content: ""; position: absolute; top: 50%; left: -9px; width: 18px; height: 18px;
    background: #ffffff;
    border-left: 1px solid rgb(32 32 32 / 0.12); border-bottom: 1px solid rgb(32 32 32 / 0.12);
    transform: translateY(-50%) rotate(45deg); border-radius: 2px;
  }
  .tooltip__step {
    display: flex; justify-content: space-between; align-items: center;
    font-family: ${MONO}; font-size: 12.5px; color: #646464;
  }
  .tooltip__step .pill {
    padding: 3px 10px; border-radius: 999px; font-family: ${FONT}; font-weight: 600;
    background: #f3f0e8; color: #202020; border: 1px solid rgb(32 32 32 / 0.12);
  }
  .tooltip h2 { margin-top: 12px; font-family: ${DISPLAY}; font-size: 23px; font-weight: 600; letter-spacing: -0.01em; }
  .tooltip p { margin-top: 8px; font-size: 15.5px; line-height: 1.5; color: #3a3a3a; }
  .progress { margin-top: 18px; height: 6px; border-radius: 999px; background: #f3f0e8; }
  .progress span { display: block; width: 62%; height: 100%; border-radius: 999px; background: #d42300; }
  .tooltip__actions { display: flex; align-items: center; gap: 10px; margin-top: 18px; }
  .btn { padding: 10px 20px; border-radius: 999px; font-size: 15px; font-weight: 600; background: #d42300; color: #ffffff; }
  .btn--ghost { background: #f3f0e8; color: #202020; }
</style>
</head>
<body>
  <div class="wash"></div>
  <div class="content">
    <div class="left">
      <div class="brand">
        <div class="brand-mark">T</div>
        <div class="brand-name">Take a Tour</div>
      </div>
      <h1>Product tours in <span class="accent">plain JavaScript</span>.</h1>
      <p class="sub">Mark a target with one attribute, describe the tour as JSON, call start(). No framework, no build step.</p>
      <div class="chips">
        <span class="chip">Zero dependencies</span>
        <span class="chip">Framework agnostic</span>
        <span class="chip">MIT licensed</span>
      </div>
    </div>
    <div class="tooltip">
      <div class="tooltip__step"><span>Step 2 of 5</span><span class="pill">Dashboard</span></div>
      <h2>Create your first project</h2>
      <p>Projects hold your dashboards. The spotlight finds the button without you writing a selector.</p>
      <div class="progress"><span></span></div>
      <div class="tooltip__actions"><span class="btn">Next</span><span class="btn btn--ghost">Skip</span></div>
    </div>
  </div>
  <div class="url"><b>thinakaranmanokaran.github.io</b>/take_a_tour</div>
</body>
</html>`;

const icon = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 180px; height: 180px; overflow: hidden;
    background: linear-gradient(150deg, #ea2804, #c01f00);
    display: grid; place-items: center;
  }
  svg { display: block; }
</style>
</head>
<body>
  <svg width="180" height="180" viewBox="0 0 32 32" aria-hidden="true">
    <rect x="9" y="9" width="14" height="5" rx="2" fill="#ffffff" />
    <rect x="13.5" y="11" width="5" height="12" rx="2" fill="#ffffff" />
  </svg>
</body>
</html>`;

async function render(browser, html, width, height, file) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.screenshot({ path: file });
  await page.close();
}

mkdirSync(publicDir, { recursive: true });

const browser = await chromium.launch();
try {
  await render(browser, card, 1200, 630, join(publicDir, "og.png"));
  await render(browser, icon, 180, 180, join(publicDir, "apple-touch-icon.png"));
} finally {
  await browser.close();
}

console.log("Wrote public/og.png (1200×630) and public/apple-touch-icon.png (180×180)");
