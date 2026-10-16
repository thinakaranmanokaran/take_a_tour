import { defineConfig } from "astro/config";

/**
 * Documentation site configuration.
 *
 * Astro builds the content pages as static HTML and ships JavaScript only for
 * the interactive parts — the playground and the theme switcher. The docs site
 * may have dev dependencies; the published core package must not.
 */
export default defineConfig({
  site: "https://take-a-tour.dev",
  trailingSlash: "never",
  build: {
    format: "directory",
  },
  devToolbar: {
    enabled: false,
  },
  vite: {
    // The workspace package is resolved as source, exactly as a consumer who
    // installed from npm would get the ESM entry.
    resolve: {
      dedupe: ["@take-a-tour/core"],
    },
  },
});
