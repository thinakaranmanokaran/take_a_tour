import { expect, test } from "@playwright/test";

/**
 * Search-engine metadata, verified against the built site served exactly as
 * GitHub Pages will serve it (base path, directory URLs, 404.html).
 *
 * The sitemap is the source of truth for "which pages exist", so every check
 * below runs over the real page list instead of a hand-maintained one.
 */

const ORIGIN = "http://127.0.0.1:5181";
const SITE = "https://thinakaranmanokaran.github.io";
const BASE = "/take_a_tour/";

async function sitemapUrls(request) {
  const response = await request.get(`${BASE}sitemap.xml`);
  expect(response.status()).toBe(200);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

test("the sitemap lists every page as an absolute URL under the base path", async ({ request }) => {
  const urls = await sitemapUrls(request);
  expect(urls.length).toBeGreaterThanOrEqual(25);

  for (const url of urls) {
    expect(url.startsWith(`${SITE}${BASE}`), `${url} is not under the base path`).toBe(true);
    const response = await request.get(url.replace(SITE, ORIGIN));
    expect(response.status(), `${url} does not resolve`).toBe(200);
  }
});

test("robots.txt allows crawling and points at the sitemap", async ({ request }) => {
  const response = await request.get(`${BASE}robots.txt`);
  expect(response.status()).toBe(200);
  const text = await response.text();
  expect(text).toContain("User-agent: *");
  expect(text).toContain(`Sitemap: ${SITE}${BASE}sitemap.xml`);
});

test("every page has a unique title, a real description, a canonical and no stray noindex", async ({
  page,
  request,
}) => {
  const urls = await sitemapUrls(request);
  const titles = new Map();
  const descriptions = new Map();

  for (const url of urls) {
    await page.goto(url.replace(SITE, ORIGIN));

    const title = await page.title();
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");

    expect(title.length, `${url} has no title`).toBeGreaterThan(10);
    expect(description?.length ?? 0, `${url} has no meta description`).toBeGreaterThan(40);
    expect(canonical, `${url} canonical`).toBe(url);

    expect(titles.has(title), `duplicate title "${title}" on ${url}`).toBe(false);
    expect(descriptions.has(description), `duplicate description on ${url}`).toBe(false);
    titles.set(title, url);
    descriptions.set(description, url);

    // Only the 404 page is noindex; it is never listed in the sitemap.
    await expect(page.locator('meta[name="robots"]'), `${url} must not be noindex`).toHaveCount(0);
  }
});

test("the 404 page is marked noindex", async ({ page }) => {
  await page.goto(`${BASE}this-page-does-not-exist/`);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
});

test("structured data parses and describes the product", async ({ page }) => {
  await page.goto(BASE);
  const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
  expect(blocks.length).toBeGreaterThanOrEqual(2);

  const types = blocks.map((block) => JSON.parse(block)["@type"]);
  expect(types).toContain("WebSite");
  expect(types).toContain("SoftwareApplication");

  // Documentation pages carry breadcrumbs instead.
  await page.goto(`${BASE}docs/api/`);
  const crumb = JSON.parse(
    await page.locator('script[type="application/ld+json"]').first().textContent()
  );
  expect(crumb["@type"]).toBe("BreadcrumbList");
});

test("the social card exists at the advertised size", async ({ page, request }) => {
  await page.goto(BASE);
  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toBe(`${SITE}${BASE}og.png`);

  const response = await request.get(`${BASE}og.png`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");

  // 1200×630 is declared in the meta tags and true of the file.
  const declared = await page.locator('meta[property="og:image:width"]').getAttribute("content");
  expect(declared).toBe("1200");
  const png = await response.body();
  expect(png.readUInt32BE(16)).toBe(1200); // width in the IHDR chunk
  expect(png.readUInt32BE(20)).toBe(630); // height in the IHDR chunk

  const icon = await request.get(`${BASE}apple-touch-icon.png`);
  expect(icon.status()).toBe(200);
});
