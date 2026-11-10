/**
 * Site-wide constants and URL helpers.
 *
 * `url()` is the single source of truth for internal links. Every href in
 * every component goes through it, so the GitHub Pages base path
 * (`/take_a_tour`) can never be remembered in one component and forgotten in
 * another. Values are injected from `astro.config.mjs` (`site`, `base`) and
 * fall back to the production defaults.
 */

const ORIGIN = (import.meta.env.SITE ?? "https://thinakaranmanokaran.github.io").replace(
  /\/+$/,
  ""
);

const RAW_BASE = import.meta.env.BASE_URL ?? "/";
const BASE = RAW_BASE.endsWith("/") ? RAW_BASE : `${RAW_BASE}/`;

export const SITE = {
  name: "Take a Tour",
  tagline: "Beautiful product tours. Zero unnecessary dependencies.",
  description:
    "Zero-dependency, framework-agnostic JavaScript library for interactive product tours and contextual onboarding. Configure tours as JSON, target elements with data-tour-id, ship light and dark themes.",
  packageName: "@take-a-tour/core",
  version: "0.1.0",
  license: "MIT",
  repoUrl: import.meta.env.PUBLIC_REPO_URL ?? "https://github.com/thinakaranmanokaran/take_a_tour",
  origin: ORIGIN,
  base: BASE,
};

/**
 * Base-aware URL for an internal path.
 *
 * Page links keep their trailing slash (`url("/docs/api/")`); asset files do
 * not (`url("favicon.svg")`).
 */
export function url(path = "/") {
  return `${BASE}${String(path).replace(/^\/+/, "")}`;
}

/**
 * Absolute URL for canonical links, sitemap entries and social images.
 * Only used in build-time (server) contexts.
 */
export function absolute(path = "/") {
  return `${ORIGIN}${url(path)}`;
}
