import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import { searchIndex } from "./src/integrations/search-index.mjs";

/**
 * Documentation and marketing site configuration.
 *
 * Hosting: GitHub Pages project site. The defaults below are the real
 * production values; both can be overridden by environment variables for
 * previews or a future custom domain.
 *
 *   SITE_URL  — site origin (default: the GitHub Pages origin)
 *   BASE_PATH — URL subpath   (default: the repository name)
 *
 * Astro builds every page as static HTML. JavaScript ships only for the
 * interactive React islands (header, search, playground, demos); page content
 * is static markup. The published core package is untouched by any of this.
 */

const SITE_URL = process.env.SITE_URL ?? "https://thinakaranmanokaran.github.io";
const BASE_PATH = process.env.BASE_PATH ?? "/take_a_tour";

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,

  // GitHub Pages serves directory-format output at `…/route/` and redirects
  // the slashless form; `always` keeps links, canonicals and the sitemap on
  // the canonical (no-redirect) URL shape.
  trailingSlash: "always",

  build: {
    format: "directory",
  },

  devToolbar: {
    enabled: false,
  },

  vite: {
    // The workspace package is resolved as source, exactly as a consumer who
    // installed from npm would get the ESM entry point.
    resolve: {
      dedupe: ["@take-a-tour/core"],
    },
  },

  integrations: [react(), searchIndex({ site: SITE_URL, base: BASE_PATH })],
});
