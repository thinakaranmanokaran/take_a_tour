# Take a Tour — documentation site

The official site for [`@take-a-tour/core`](../../packages/core): a marketing
home page, 20 documentation topics under `/docs/`, a live playground, runnable
example panels, a component gallery, a theme customiser, changelog, about and a
designed 404 — 27 built routes in total.

It is a static Astro site. Route files are thin `.astro` shells; every piece of
UI is a `.jsx` component used from those shells, and the interactive parts are
hydrated React islands that run the real library (hero demo, showcase,
examples, playground, gallery, customiser, search, theme switch).

**Source policy: JavaScript + JSX only.** There is no `.ts`/`.tsx` source in
this app. `tsconfig.json` exists so tooling can parse JSX (`allowJs: true`,
`checkJs: false`) — new UI goes in `.jsx`, new routes in `.astro` shells.
Formatting and linting happen from the repository root (`npm run format`,
`npm run lint`).

## Commands

Run from `apps/docs` (or with `--workspace @take-a-tour/docs` from the root):

| Command             | What it does                                                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run dev`       | Dev server at <http://localhost:4321/take_a_tour/>                                                                                               |
| `npm run build`     | Static build into `dist/` (not committed)                                                                                                       |
| `npm run preview`   | Serves the built site at the base path (verified: `/take_a_tour/` 200, `/` 404)                                                                 |
| `npm run og:generate` | Re-renders `public/og.png` (1200×630) and `public/apple-touch-icon.png` (180×180) with the already-installed Playwright Chromium                |
| `npm run perf:measure` | Measures the built site in Chromium: per-route requests/bytes, LCP, CLS, event timing, and proves the library JS stays lazy on the home page |

From the repository root:

| Command                  | What it does                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `npm run docs:build`     | The same docs build, from the root                                                                                  |
| `npm run test:browser:docs` | Rebuilds the site, then runs the 31-test docs browser suite (playground, site behaviour, SEO, link crawl) against a Pages-like static server |

The Playwright docs suite emulates GitHub Pages through
`packages/core/tests/browser/docs-server.mjs`: everything is served under
`/take_a_tour/`, slashless directory URLs 301 to the trailing-slash form, and
unknown paths return the built 404 page — so the tests catch anything that
would break on the real host.

## URLs and the GitHub Pages base path

Production is a GitHub Pages **project site**:

- site: `https://thinakaranmanokaran.github.io/take_a_tour/`
- every route lives under the `/take_a_tour/` base, with canonical trailing
  slashes (`trailingSlash: "always"`, `build.format: "directory"`)

Two rules keep this correct:

1. **All internal links go through `url()`** from `src/config/site.js`. Never
   hardcode an internal href — the `docs-links` browser test crawls the built
   HTML and fails on any link or fragment that does not resolve under the base.
2. **Stay slash-consistent.** Canonicals, the sitemap and internal links all
   use the trailing-slash form, which is the URL GitHub Pages serves directly;
   the slashless form is only a 301.

Both production values can be overridden at build time for previews or a
future custom domain:

| Variable           | Default                                | Used by                                                     |
| ------------------ | -------------------------------------- | ----------------------------------------------------------- |
| `SITE_URL`         | `https://thinakaranmanokaran.github.io` | `astro.config.mjs` — canonical origin, sitemap, OG URLs     |
| `BASE_PATH`        | `/take_a_tour`                         | `astro.config.mjs` — base path                              |
| `PUBLIC_REPO_URL`  | the GitHub repository                  | `src/config/site.js` — header/footer links                  |

Build-time extras live in `src/integrations/search-index.mjs` (wired as an
`astro:build:done` hook): it injects heading ids using the shared slugifier in
`src/lib/slugify.js`, writes each public page's section list into the site
rail's static HTML, and writes `search-index.json`, `sitemap.xml`, `robots.txt`
and `.nojekyll`. The sitemap excludes the 404 page.

### Project-site `robots.txt` caveat

Crawlers read `robots.txt` from the **host root**, and this project does not
own `https://thinakaranmanokaran.github.io/robots.txt` — the file at
`/take_a_tour/robots.txt` is informational only. The practical path for search
engines is Search Console: add the site, verify ownership, and submit
`https://thinakaranmanokaran.github.io/take_a_tour/sitemap.xml`.

## How the site uses the library

`@take-a-tour/core` is consumed as a workspace package with no aliasing. Its
`exports` map points `import` at `src/index.js`, so the site bundles the same
ESM source an npm consumer importing the package would get. The stylesheet is
imported statically (`@take-a-tour/core/styles.css`), so the `--tat-*` tokens
exist before any tour starts.

The demos share one lifecycle hook, `src/hooks/useTour.js`, which:

- **dynamic-imports the library on first interaction** — the core chunk is
  never downloaded at page load, and `npm run perf:measure` asserts this by
  watching the network (the home page's status line says so out loud);
- destroys the previous tour before starting a new one (the library allows a
  single active tour per document);
- destroys on unmount, so no overlay, listener or observer survives a
  navigation.

The demos render the real library, and the library pins its own `--tat-*`
tokens on each tour root per theme. So the site maps its palette onto them in
`global.css` (`:root .tat-root[data-tat-theme="light"|"dark"]`), which is what
keeps every demo tour orange and theme-aware. The live customiser on
`/docs/themes/` writes the site's `--tat-site-primary` / `--tat-site-contrast`
hooks that the same block consumes, so adjusting the accent restyles a running
tour immediately.

## Design system

`src/styles/global.css` is the single home of the visual language — 21 numbered
sections, everything driven by custom properties; components never hardcode a
colour. The short version:

- **Canvas and colour.** Warm cream (`#f9f7f3`) with near-black ink and one hot
  orange used sparingly. `--brand` (`#ea2804`) is art only — the hero band, the
  404 digits, the logo tile; every interactive element uses `--primary`
  (`#d42300` in light, `#ff6a3d` in dark), deepened so text and controls clear
  WCAG AA on their own surfaces.
- **Type.** Three self-hosted variable families (Fontsource, bundled at build
  time — no CDN or runtime fetch): Bricolage Grotesque for display, Geist for
  body and UI, JetBrains Mono for code, tokens and labels. Emphasis is a change
  of family, not a shout — strong runs use the display face instead of heavier
  body text.
- **Shape and depth.** Interactive elements are full-round pills; cards and
  wells use a 10–16px radius. The cream canvas stays flat — no drop shadows;
  depth belongs to dark surfaces and floating demo chrome.
- **Rhythm.** The home page alternates cream → orange hero → cream → dark
  "how it works" band → cream → black footer, and code wells are dark in both
  themes: code always reads as a dark well, on cream and on ink alike.
- **Themes.** `data-theme` on `<html>` swaps every token to the ink-surface
  palette with a brighter orange. `prefers-reduced-motion` is honoured
  throughout, and the browser suite runs axe (wcag2a + wcag2aa) over the
  landing, docs, playground and 404 pages in both themes.

`public/og.png` and `public/apple-touch-icon.png` come from
`npm run og:generate`, which embeds the real font files into a headless
Chromium render, so the social card uses the site's own type; `favicon.svg`
is hand-written against the same palette.

## Navigation

Two rails, both React islands whose links are rendered into the static HTML:

- **Public pages** (`/examples/`, `/about/`, `/changelog/`, `/playground/`)
  get a left **Site** rail: Home, Docs, Playground, Examples, About, Changelog.
  The **home page has no left rail** — its full-width layout is deliberate, the
  only public page without the site rail. On pages that have the rail, the
  current page's `h2` sections nest under its entry (when a page has two or
  more) with a scroll-spy highlight; the changelog, a run of release notes
  rather than sections, shows none. That nested list is written into the built
  HTML by the build step, so it is there before JavaScript runs and hydration
  adopts it unchanged — nothing shifts into place after load.
- **Docs pages** keep the grouped left rail and gain section navigation: a
  sticky **On this page** rail at 1280px and up, and below that a collapsed
  inline disclosure above the article heading — so 901–1279px stays two real
  columns instead of a cramped three.

Both rails fold. Above 900px the chevron in a rail's header collapses its column
to zero and leaves a circular re-open control at the left edge, with focus
following the control in both directions; at 900px and below — where the rails
stack above the content — the same control folds the list itself. Everything is
open by default and nothing is persisted; the collapsed states are pure CSS
(one `is-nav-collapsed` class on the layout), so heading ids, the static link
markup and the `#content` / `.sidebar` / `.toc a` contract the browser tests
locate stay intact.

One implementation note, learned the hard way: the re-open control is rendered
as a **sibling of the rail**, not inside it. A fixed-position control inside the
sticky, `visibility: hidden` rail is painted beneath page content in Chromium —
`z-index` does not lift it out.

## Deployment (GitHub Pages)

`.github/workflows/deploy-docs.yml` builds and deploys the site. It runs on
pushes to `main` that touch the site, the library or the lockfile, and can be
triggered manually via `workflow_dispatch`.

One-time setup, in repository settings (not code):

> **Settings → Pages → Source: GitHub Actions**

The workflow uploads `apps/docs/dist` as the Pages artifact. No build output is
committed and no CI-specific configuration is needed, because the base path
lives in `astro.config.mjs`.

**Nothing here deploys or publishes by itself.** The Pages workflow only runs
when the repository owner pushes to `main` or triggers it manually. The site is
live at <https://thinakaranmanokaran.github.io/take_a_tour/>, and
`@take-a-tour/core@0.1.0` is published on npm.
