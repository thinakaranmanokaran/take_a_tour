# Implementation report

What was built, what was actually executed, and what is still outstanding.

Every number below is the output of a command that was run. Nothing is
projected, and nothing is claimed as passing without having been observed
passing.

Status: `[x]` done and verified · `[~]` partial · `[ ]` not started

---

## Summary

| Suite | Command | Result |
| ----- | ------- | ------ |
| Unit + integration | `npm test` | **230 passed / 230**, 11 files |
| Browser — layout | `npm run test:browser` | **15 passed** |
| Browser — accessibility | `npm run test:browser` | **13 passed** |
| Browser — cleanup | `npm run test:browser` | **36 total** |
| Browser — docs site | `npm run test:browser:docs` | **30 passed** (playground, site, SEO, link crawl) |
| Lint | `npm run lint` | clean |
| Format | `npm run format:check` | clean |
| Build | `npm run build` | CJS bundle written |
| Runtime dependency audit | `npm run check:deps` | zero runtime dependencies |
| Type declarations | `npm run typecheck:types` | `tsc --noEmit` clean |
| Package contents | `npm run pack:check` | 57 files, correct |
| Clean consumer install | `npm run test:consumer` | ESM + CJS + CSS + types all pass |
| Documentation build | `npm run docs:build` | 27 pages built |
| Site performance measurement | `npm run perf:measure` (apps/docs) | recorded in Phase 8 |
| Dependency vulnerabilities | `npm audit` | 0 |

`npm run verify` runs lint → format → test → build → dep audit → typecheck →
pack audit → consumer install → docs build, and passes end to end.

---

## Phase 0 — Foundation · complete

npm-workspaces monorepo, ESLint 9 flat config, Prettier, CI workflow, and a
dependency audit that fails the build rather than being a convention.

### Executed

| Check | Result |
| ----- | ------ |
| `npm install` | 0 vulnerabilities |
| `npm run lint` | clean |
| `npx prettier --check .` | all files formatted |

### Decisions recorded

- **Test toolchain lives in the root `package.json`.** npm did not hoist
  `jsdom` into the root, and vitest resolves `jsdom` from its own location, so
  keeping it in the core workspace made the runner unresolvable. Moving
  vitest, jsdom, Playwright, esbuild and typescript to the root fixed it.
- **`jsdom` pinned to `^26`.** jsdom 27+ requires Node ≥20.19, which would
  break the CI job running Node 20.
- **Vulnerable dev-tool versions were upgraded rather than accepted.** The
  initial vitest 2.x / esbuild 0.24 install had 6 advisories including 2
  critical. Current install: 0.
- **ESLint does not lint `.jsx`, `.vue`, `.astro` or `.d.ts`.** Those need
  plugins that are not installed; a parser that cannot read the file produces
  noise rather than coverage. They are covered by the build and `tsc` instead,
  and this is stated in `eslint.config.js`.

---

## Phase 1 — Core foundation · complete

Configuration, registry, state machine, navigation, target resolution, events,
engine and public API.

### Target resolution — the review's most important correction

Identifiers are **data, never selectors**. The query uses a constant selector
and compares `getAttribute()` values exactly, so nothing from configuration
reaches the CSS parser:

```js
const candidates = root.querySelectorAll("[data-tour-id]");
for (const el of candidates) if (el.getAttribute("data-tour-id") === id) matches.push(el);
```

Verified in 24 resolver tests, including identifiers containing `"`, `'`, `\`,
`%`, `[`, `]`, `:`, `*`, `#`, `{`, `}`, leading/trailing whitespace and
unicode — all resolve exactly.

### Bugs found and fixed by these tests

1. **Destroyed tours were never unregistered.** Re-creating a tour with the
   same `tourId` failed as a duplicate. Fixed in `engine.destroy()`.
2. **A `skip`-strategy step was not skipped when it was the first step.**
   `start()` presented it anyway. Both paths now route through `presentFrom()`.
3. **A `start()` cancelled by `destroy()` resolved instead of rejecting**, so a
   caller awaiting it would believe the tour was running.

---

## Phase 2 — Positioning · complete

Twelve placements plus `center`, as pure functions; space scoring; fallback
ordering; viewport clamping; arrow tracking; rAF batching; `ResizeObserver`;
nested scroll-container tracking.

### Executed

`tests/unit/positioning.test.js` — **24 passed**, covering all 13 placements,
side flipping at every viewport edge, corner overlap, clamping on both axes,
alignment variants, arrow insets, and an exhaustive assertion that no placement
produces out-of-viewport coordinates.

### Bug found and fixed

**`scorePlacement` added the offset *object* to a number**, producing `NaN` for
every score — so placement fallback silently never engaged. Fixed to use
`offset.y` / `offset.x` per axis.

---

## Phase 2.5 — End-to-end thin slice · complete

The review's first milestone.

### Executed

`tests/integration/tour.test.js` — **34 passed**: start, navigate, complete,
pause/resume, stop, skip, restart, `goTo`, `startAt`, `loop`, conditional and
async `when` predicates, all four missing-target strategies, all three
concurrency policies, and DOM/listener cleanup after destroy.

### Bug found and fixed

**Two overlays in the DOM at once.** A tour paused to make room for another
kept its `.tat-root` mounted — two dialogs in the accessibility tree and an
unpredictable tab order. A *displaced* tour now releases its overlay and
rebuilds it on resume; only a *user*-paused tour stays on screen, dimmed.

---

## Phase 3 — UI and design system · complete

Design tokens, light/dark/system themes, restrained CSS animation, a local SVG
icon set with Lucide attribution, and the full component system: overlay,
spotlight, tooltip, centred modal, progress (bar and counter), navigation
controls, custom actions, completion surface, live region.

### Security boundary

`textContent` everywhere in ordinary configuration. Exactly one
`innerHTML` call site exists, in `components/content/unsafe-html.js`, isolated
so the dependency audit can allowlist precisely one file and a reviewer can read
the entire trusted-markup surface at once. Reachable only via an explicit
per-tour `unsafeHTML: true`.

---

## Phase 4 — Reliability · complete

### Executed

| Suite | Result |
| ----- | ------ |
| `tests/unit/emitter.test.js` | 14 passed |
| `tests/unit/persistence.test.js` | 16 passed |
| `tests/unit/content-security.test.js` | 17 passed |
| `tests/integration/accessibility.test.js` | 29 passed |
| `tests/integration/lifecycle-guards.test.js` | 25 passed |

### Bugs found and fixed

4. **Concurrent `start()` calls raced.** The state transition happens after an
   `await`, so a second `start()` in the same tick passed the "already running"
   check. Fixed with a `starting` promise assigned synchronously.
5. **`scorePlacement` NaN** (see Phase 2).
6. **Rapid `next()` clicks could paint a superseded step.** Fixed with a
   monotonic navigation sequence; a superseded navigation returns `"stale"` and
   touches nothing.
7. **Escape still fired after `destroy()`.** The document `keydown` listener
   outlived the tour. Now registered on the disposal stack.
8. **The live region existed even with `announce: false`.** The announcer is now
   created conditionally.

---

## Phase 5 — Examples and browser tests · complete

### Examples

| Example | Build | Notes |
| ------- | ----- | ----- |
| `examples/vanilla` | dev server | No framework, imports by package name |
| `examples/vite` | **57.6 kB** bundle | Theme switcher, CSS variable overrides |
| `examples/react` | built | `useEffect` create + cleanup, StrictMode-safe |
| `examples/vue` | built | `onMounted` / `onUnmounted`, keep-alive guidance |
| `examples/spa-route` | dev server | Survives route changes with `missing: "wait"` |

All three buildable examples compiled successfully. The Vite bundle at 57.6 kB
is the practical demonstration that the published ESM entry tree-shakes.

### Browser tests — 36 passed

jsdom has no layout engine, so everything involving geometry is verified in
Chromium.

| File | Tests | Covers |
| ---- | ----- | ------ |
| `layout.spec.js` | 15 | Real `getBoundingClientRect`, spotlight padding, placement on all four edges, flipping at pinned edges, no overflow in any placement, page scroll, nested scroll container, viewport resize, 380px mobile viewport, late-mounted targets, duplicate-id ambiguity, dotted/quoted identifiers, scroll-into-view |
| `accessibility.spec.js` | 13 | axe-core scan (no critical violations), dialog semantics, accessible names on every control, decorative icons, live region, focus movement and restoration, modal focus trap, non-trap for tooltips, keyboard navigation, progressbar semantics |
| `cleanup.spec.js` | 8 | Zero residue after destroy, listener removal, no-op after destroy, 10 start/destroy cycles, restart after stop, tourId release, keyboard ignored post-destroy, single overlay under displacement |

Two tests were corrected during this phase because **the library was right and
the test was wrong**:

- A "flip at the bottom edge" test scrolled the target to the edge, then the
  tour's own `scrollIntoView` re-centred it. Replaced with targets pinned to the
  viewport, which removes the scroll dependency entirely.
- A spotlight geometry assertion used a whole-pixel tolerance against
  fractional device pixels. Now a 1.5px tolerance, stated as such.

---

## Phase 6 — Documentation · complete

Astro site, 22 sections, live playground, component gallery, theme customiser.

### Executed

`npm run docs:build` — **Complete**, 22 pages.

`npm run test:browser:docs` — **11 passed**, run three consecutive times with
identical results after a flake fix:

- The playground starts a real tour: `.tat-root`, `.tat-overlay`,
  `.tat-spotlight`, `.tat-tooltip` all appear with the library's own classes.
- The spotlight has **real geometry** around a real target, matching within
  3px of the configured 6px padding. This cannot pass against a mockup.
- Editing the JSON in the textarea changes the tour the visitor sees, and the
  spotlight anchors to the requested target.
- An invalid configuration surfaces **the library's own error message**
  (`at least one step`), not a message invented by the playground.
- The theme switcher, component gallery and theme customiser all drive real
  tours.
- Every sidebar link resolves to a 200.

### Bugs found and fixed

1. **The playground never exposed `window.playground`.** It referenced
   `PLAYGROUND_TARGETS`, a frontmatter import that is build-time only and not
   in scope in an Astro client `<script>`. Every playground test hung waiting for
   it. Removed the reference and documented the scoping rule in the component.
2. **The gallery and theme customiser threw on click.** Their steps had no
   target identifier, which correctly failed validation. Rather than weaken the
   validation, real `data-tour-id` targets were added to those panels.
3. **A flaky geometry assertion** exited its stability wait during the gap
   between the smooth scroll starting and the first scroll frame. Now requires
   8 consecutive stable frames including `scrollY`.
4. Six Astro pages failed to prerender because inline `<code>{ defaults }</code>`
   was parsed as a JavaScript expression. Escaped with HTML entities.

> Superseded by Phase 8: the site was restructured — thin `.astro` shells,
> JSX page components, hydrated islands, GitHub Pages base path — and now
> builds 27 routes with a 31-test browser suite.

---

## Phase 7 — Release readiness · complete

### Executed

| Check | Result |
| ----- | ------ |
| `npm run build` | `dist/index.cjs` 110.7 kB, `index.min.cjs` 55.5 kB |
| `npm run check:deps` | 44 source files, 106 specifiers, **zero runtime dependencies** |
| `npm run typecheck:types` | `tsc --noEmit` clean against the shipped `.d.ts` |
| `npm run pack:check` | 57 files; no tests, fixtures, tooling config or source maps |
| `npm run test:consumer` | see below |

### Clean consumer install — all passed

The real tarball, installed into a throwaway project with no workspace links:

```
  ok  packed take-a-tour-core-0.1.0.tgz
  ok  installed the packed tarball
  ok  zero runtime dependencies declared
  ok  1 entries in node_modules (expected 1: @take-a-tour)
    esm ok
  ok  ESM entry point works
    cjs ok
  ok  CommonJS entry point works
    css ok (20649 bytes across 5 sheets)
  ok  @take-a-tour/core/styles.css resolves and contains the design system
  ok  types/index.d.ts compiles against a real consumer project
  ok  published contents: LICENSE, README.md, dist, package.json, src, styles, types
```

The `"type": "module"` + `.cjs` interaction the review flagged is handled by the
`exports` map and verified by a real `require()` in a real consumer.

### Build issues found and fixed

- Source maps were being published (2 × 237 kB). Excluded via `!dist/**/*.map`.
- `packages/core` had no README or LICENSE, so `npm pack` shipped without them.
  Both added.

---

## Phase 8 — Official website · complete

The official site for the library (`apps/docs`), per `reference/WEBSITE.md`:
27 routes — a marketing home page, 20 documentation topics plus the docs
index, `/examples/`, `/playground/`, `/changelog/`, `/about/` and a designed
404 — built as a static Astro site with hydrated React islands, published as a
GitHub Pages project site under `/take_a_tour/`.

### What was built

- **Pure JavaScript + JSX.** Route files are thin `.astro` shells; every UI
  block is a `.jsx` component used from those shells. No `.ts`/`.tsx` source
  exists in the app; `tsconfig.json` only lets tooling parse JSX.
- **The real library powers every interactive piece** — hero demo, feature
  showcase, example panels, playground, component gallery, theme customiser —
  through one shared hook (`src/hooks/useTour.js`) that dynamic-imports the
  library on first interaction, destroys any previous tour before starting,
  and destroys on unmount.
- **One base-path owner.** `url()` in `src/config/site.js` is the only way an
  internal href is built; `trailingSlash: "always"` and directory builds keep
  every URL on the canonical (non-redirect) form.
- **Build extras** (`astro:build:done`): heading ids via the shared slugifier,
  `search-index.json` (252 sections), `sitemap.xml` (26 canonical URLs, the
  404 excluded), `robots.txt`, `.nojekyll`.
- **Search (Ctrl+K)** over the built index, loaded only when the dialog opens.
- **SEO**: unique title/description per page (short descriptions rewritten),
  base-aware canonicals, OG/Twitter with absolute URLs, `WebSite` +
  `SoftwareApplication` + `BreadcrumbList` JSON-LD, `noindex` on the 404, and
  a rasterised `og.png` (1200×630) + `apple-touch-icon.png` (180×180)
  generated with the installed Playwright Chromium (`npm run og:generate`).
- **Deployment prepared, not executed**: `.github/workflows/deploy-docs.yml`
  (Pages artifact + deploy job, path-filtered pushes to `main` plus manual
  dispatch); `npm run test:browser:docs` runs in CI.

### Executed

| Check | Result |
| ----- | ------ |
| `npm run docs:build` | 27 pages; 26 sitemap URLs; 252 sections indexed |
| `npm run test:browser:docs` | **30 passed** (4 spec files, table below) |
| `npm run verify` | end to end, including the docs build |
| `npm run lint` / `npm run format:check` | clean |
| Text parity vs pre-rewrite build | only the deliberate copy fixes differ |
| `npm run perf:measure` | recorded under "Measured performance" |
| Lighthouse 13.5.0 (desktop home) | 95–98 performance · 100 a11y · 100 best practices · 100 SEO |
| `npm audit` | 0 vulnerabilities |

Docs browser suite (Pages-like static server: base prefix, 301 on slashless
directory URLs, the built 404 for unknown paths):

| File | Tests | Covers |
| ---- | ----- | ------ |
| `docs-playground.spec.js` | 12 | The original 11 DOM-contract tests, preserved; playground tours, real spotlight geometry, JSON edits, both error paths, gallery + customiser tours, zero residue after repeated start/destroy, sidebar links |
| `docs-site.spec.js` | 10 | Hero tour with real geometry, example panel tour, Ctrl+K search opening an anchor, theme persistence, heading ids + TOC, designed 404 with 404 status, skip link, mobile menu (Escape + navigation), axe on key pages in light and dark, reduced-motion |
| `docs-seo.spec.js` | 6 | Sitemap as absolute base-aware URLs, robots pointing at it, unique title/description/canonical with no stray `noindex`, the 404 `noindex`, JSON-LD parses, social card size |
| `docs-links.spec.js` | 2 | The build produced pages; every internal link **and fragment** resolves under `/take_a_tour/` |

### Measured performance

Method: `npm run perf:measure` (`apps/docs/scripts/measure-perf.mjs`) loads
the built site through the Pages-like server in headless Chromium (desktop
viewport, cold cache, software rendering — the machine has no GPU), reads
requests, transfer bytes, LCP and CLS from the browser, and clicks the theme
switch once for event timing.

| Route | Requests | JS | CSS | Total | LCP | CLS |
| ----- | -------- | -- | --- | ----- | --- | --- |
| home | 13 at load → 14 after starting the hero tour | 291.1 kB | 46.0 kB | 319.1 → 373.7 kB | 860 ms | 0.000 |
| docs (getting started) | 9 | 226.8 kB | 32.7 kB | 280.7 kB | 404 ms | 0.000 |
| examples | 12 | 246.4 kB | 46.0 kB | 349.4 kB | 368 ms | 0.000 |
| playground | 11 | 237.9 kB | 46.0 kB | 305.1 kB | 408 ms | 0.000 |

The laziness contract held: on the home page the core library chunk appears
**only after** the visitor presses "Run the real tour" — one script request
(`src.*.js`, ~54 kB), absent from every earlier request. `client:visible`
islands (showcase, example panels) hydrate on scroll by design; the run
counts 3/4 and 3/10 islands hydrated at load, which is the intended
behaviour, not a defect.

Lighthouse 13.5.0, desktop preset, home: **95–98 performance**, **100
accessibility**, **100 best practices**, **100 SEO**; FCP 456–558 ms,
LCP 627–792 ms, TBT 111–166 ms, CLS ≈ 0.

Lighthouse's mobile emulation on this machine was unstable: three runs of the
same build scored 46, 59 and 92 (TBT 4577, 2838 and 59 ms). A controlled
Playwright pass with CDP 4× CPU throttling in the same Chromium — same
viewport, same emulation — produced worst long tasks of 183–559 ms, so the
outlying numbers are an artefact of this environment (software rendering,
emulation inside emulation), not reproducible behaviour of the site. Recorded
for transparency; nothing was tuned to them.

One audit result was real and fixed: the sample-app mock injected an `<h4>`
into the page outline, failing Lighthouse's heading-order audit (the a11y
score was 98 on desktop for that reason). It is now a `<p>` with identical
styling — the category scores 100.

### Deployment preparation

- `.github/workflows/deploy-docs.yml`: install → `npm run docs:build` →
  `actions/upload-pages-artifact` (`apps/docs/dist`) →
  `actions/deploy-pages`; `permissions: pages: write, id-token: write`;
  `environment: github-pages`; concurrency group; path-filtered pushes to
  `main` and `workflow_dispatch`.
- `.github/workflows/ci.yml`: the verify job runs `npm run verify`; the
  browser-tests job runs `npm run test:browser:docs`.
- `apps/docs/README.md` documents local dev
  (`http://localhost:4321/take_a_tour/` — preview verified: base path 200,
  root 404), `SITE_URL`/`BASE_PATH`/`PUBLIC_REPO_URL`, the `url()` rule, OG
  regeneration, the project-site `robots.txt` caveat (submit the sitemap
  through Search Console), the JS/JSX-only policy and the one-time Pages
  enable step (Settings → Pages → Source: GitHub Actions).
- **Nothing was pushed or deployed.** Enabling Pages and the first deploy are
  the repository owner's actions.

---

## Phase 9 — Design-system restyle · complete

The site was restyled to a new design system: cream canvas, one hot orange,
three type families, pill-shaped interactive elements, dark-only code wells.
No route, DOM contract or behaviour changed — all 27 routes and the 31-test
docs browser suite kept working throughout, and `packages/core` was not
touched.

### What changed

- **Type.** Three self-hosted variable families, installed as
  `@fontsource-variable/*@5.3.0` and imported in `BaseLayout.astro`: Bricolage
  Grotesque (display), Geist (body/UI), JetBrains Mono (code). The browser
  loads exactly three `woff2` files — one latin subset per family, all done by
  ~390 ms against the local server. No CDN, no runtime font fetch.
- **Palette.** `--brand` (`#ea2804`) is art only — hero band, 404 digits, logo
  tile; every interactive element uses `--primary` (`#d42300` light,
  `#ff6a3d` dark), deepened so controls and text clear WCAG AA. Measured:
  4.86:1 on cream, 5.20:1 with white text, 6.11:1 for the dark-theme orange on
  the ink surface. The hero band base is `#c01f00` with band text at 5.95:1 and
  a decorative mesh kept behind the copy.
- **Rhythm and wells.** Home alternates cream → orange hero → cream → a new
  dark "how it works" band → cream → black footer. Code wells are dark in both
  themes with a single light-on-dark token palette.
- **Library harmonisation.** The demos run the real library, whose stylesheet
  pins its `--tat-*` tokens per tour root. The site maps its palette onto them
  with a specificity-safe block
  (`:root .tat-root[data-tat-theme="light"|"dark"]`), and the live customiser
  now writes the site's `--tat-site-primary` / `--tat-site-contrast` hooks that
  the same block consumes — so the accent control genuinely restyles a running
  tour (verified: site orange → #00b894 → reset).
- **Assets.** `og.png` (1200×630) and `apple-touch-icon.png` (180×180)
  regenerated by `npm run og:generate` with the real font files embedded;
  `favicon.svg` rewritten as an orange "T" tile.

### Bugs found and fixed during the restyle

Bugs 16–20 in the table below: invisible dark-on-dark code in light mode,
shadowed tour-token overrides (demos stuck indigo), the customiser accent
control that had never worked, an invisible dark-mode search selection, and
the 404 digits losing their brand colour to specificity.

### Executed

| Check | Result |
| ----- | ------ |
| `npm run docs:build` | 27 pages |
| `npm run test:browser:docs` | **30 passed** |
| axe (wcag2a + wcag2aa), 4 page shapes × 2 themes | **0 serious/critical violations** |
| Contrast pairs (computed) | interactive orange ≥ 4.86:1 on every surface it is used on |
| `npm run perf:measure` | recorded below — CSS 57.1 kB, home LCP 824 ms, CLS 0.0203 |
| Visual review | light/dark screenshots of every page shape, plus hero/playground/customiser tours running, Ctrl+K search and the mobile menu |

The axe test in `docs-site.spec.js` now sets a 120 s per-test timeout: eight
full scans (≈25 s of pure audit on this machine) plus their navigations do not
fit the default 30 s. The assertions are unchanged.

### Measured performance (after the restyle)

| Route | Requests | JS | CSS | Total | LCP | CLS |
| ----- | -------- | -- | --- | ----- | --- | --- |
| home | 17 | 291.1 kB | 57.1 kB | 493.5 kB | 824 ms | 0.0203 |
| docs (getting started) | 12 | 226.8 kB | 43.9 kB | 400.4 kB | 432 ms | 0.0035 |
| examples | 15 | 246.4 kB | 57.1 kB | 469.1 kB | 388 ms | 0.0144 |
| playground | 14 | 237.9 kB | 57.1 kB | 424.8 kB | 416 ms | 0.0017 |

CSS grew ≈11 kB over Phase 8 (the restyle plus the three font faces' CSS);
`other` bytes include the three latin `woff2` subsets (~145 kB on home). The
laziness contract still holds — the library chunk appears only after starting
the hero tour, and `client:visible` islands still hydrate on scroll (3/4
islands at load on home, 3/10 on examples — the same counts as Phase 8).
Machine variance, recorded for transparency: the first home LCP reading right
after a heavy test run was 2.3 s; the next two runs on the same build read
912 ms and 824 ms. Nothing was tuned to the outliers.

---

## Phase 10 — Navigation · complete

Public pages now carry a left site rail — the pages plus the current page's own
sections — and docs gained section navigation: a foldable right rail at 1280px
and up, and a foldable inline disclosure below that. All 27 routes, the DOM
contract and both browser suites kept passing throughout, and `packages/core`
was not touched.

### What changed

- **`SiteSidebar.jsx`** — a "Site" group listing Home, Docs, Playground,
  Examples, About and Changelog (`PUBLIC_PAGES` in `src/data/nav.js`). The
  current page's `h2` sections nest under its entry when there are two or more,
  with a scroll-spy highlight; the changelog (a single top-level heading) lists
  none, and sections only ever render under the page they belong to — the list
  never claims a link goes somewhere it doesn't.
- **`SiteLayout.astro`** — replaces `HomeLayout.astro`: BaseLayout plus a
  two-column `.layout--site` (rail + `#content`), used by the five public page
  shells. Home's full-bleed bands intentionally stay full-width: the rail sits
  outside them, flush left with a hairline border, not indenting the design.
- **Docs rails** — the left rail gained the same "Documentation" head with a
  fold control and is now `client:idle`; the right rail gained a fold control on
  its "On this page" label. Below 1280px the right rail is replaced by a
  collapsed inline `toc-disclosure` above the article heading, so 901–1279px
  keeps two real columns instead of cramming a three-column layout.
- **Fold model (`useRailCollapse.js`)** — one class (`is-nav-collapsed`) on the
  closest `.layout` drives everything: above 901px the rail's column collapses
  to zero and a fixed circular re-open control appears at the left edge, with
  focus handoff in both directions; at 900px and below — where the rails stack
  above the content — the same control folds the list. Open by default, no
  persistence, no layout shift on first paint.
- **Shared heading logic (`useSectionHeadings.js`)** — heading ids, slugs and
  scroll-spy moved out of the TOC so the site rail and the TOC share one
  implementation; both use the slugified ids the build step already injects.
- **The section list is prerendered.** The `astro:build:done` step that writes
  heading ids now also writes the current page's `h2` list into the site rail's
  static HTML (same rule as the island: two or more `h2`s), and the island
  adopts that list on its first render — hydration changes nothing, and the
  sections exist for a no-JS reader. Measured effect: the rail's links no
  longer jump ~270px into place after load (examples CLS 0.0758 → 0.0191).
- **DOM contract preserved** — the inline disclosure deliberately avoids the
  `.toc` class (the browser tests locate `.toc a` uniquely), the rail TOC still
  ships its list in the static HTML, and every navigation link is a plain SSR
  anchor; folding is CSS plus one class, so nothing depends on hydration.

### Bugs found during the visual review

Bug 21 in the table below: the fixed re-open control, rendered inside the
sticky, `visibility: hidden` rail, was painted beneath page content in
Chromium — `z-index: 5000` would not lift it. Rendering it as a sibling of the
nav (outside the sticky subtree) fixes it. A second, smaller leak: the
collapsed three-column rule meant for docs also matched `.layout--site`, giving
the collapsed site rail a phantom third grid track; scoping that rule with
`:not(.layout--site)` fixed it.

A third was caught by the performance check rather than the eye: with the
section list rendered only after hydration, the rail's other links shifted down
by the list's height on every public page (examples CLS 0.0758, home 0.0362).
Prerendering the list into the built HTML — and hydrating the identical DOM —
removed the shift (examples 0.0191, home 0.0305).

### Executed

| Check | Result |
| ----- | ------ |
| `npm run docs:build` | 27 pages |
| `npm run test:browser:docs` | **30 passed** — including the axe scans in both themes and the link crawl, which now also verifies every prerendered rail fragment |
| `npm run test:browser` | **36 passed** |
| Hydration check | SSR section list and hydrated DOM identical on all five public pages, console clean |
| `npm run lint` / `npm run format:check` | clean |
| Visual review | 17 screenshots: home (light, dark, scrolled, collapsed), docs at 1440 / 1200 / 901 / 820 / 390, examples, about, changelog, playground, mobile folds and re-open states |
| `npm run perf:measure` | recorded below |

### Measured performance (after navigation)

Requests grow by four per route (the site rail's island, the docs rail now
being an island, and their hydration chunks) — JS +6–7 kB, CSS +3 kB. The home
route's first reading after the heavy test run was LCP 1668 ms; the next run
read 936 ms, the same right-after-the-suite variance Phase 9 recorded. The
library chunk is still fetched only after starting the hero tour.

| Route | Requests | JS | CSS | Total | LCP | CLS |
| ----- | -------- | -- | --- | ----- | --- | --- |
| home | 21 | 297.9 kB | 60.0 kB | 505.5 kB | 936 ms | 0.0305 |
| docs (getting started) | 16 | 233.5 kB | 46.8 kB | 411.7 kB | 524 ms | 0.0029 |
| examples | 19 | 253.2 kB | 60.0 kB | 481.2 kB | 556 ms | 0.0191 |
| playground | 18 | 244.7 kB | 60.0 kB | 436.4 kB | 500 ms | 0.0012 |

### Follow-up after the Lighthouse review

The first Lighthouse run after Phase 10 exposed a regression the DOM checks
could not see: every documentation page threw two React `#418` hydration
mismatches. `useSectionHeadings` read the article's headings during its first
client render, but the docs TOC island renders no list at build time — the
server's markup and the first client render disagreed. The guard that was
supposed to prevent this only existed inside the function that already needed
the DOM, so it never applied to the docs case. `readHeadings` now always reads
(the effect's behaviour), and a separate `initialHeadings` decides what the
first render may use: the prerendered list only when the build step's
`prerendered` selector is actually in the DOM, otherwise nothing. The site
rail still adopts its server-rendered list; the docs TOC still fills after
mount, now without a mismatch. A new browser test loads home, examples, the
playground and a docs page while listening for both `pageerror` (React reports
hydration mismatches through `reportError`, not the console) and console
errors; it fails on either.

The same review checked the documentation against the source and found two
pages that would mislead a reader: Installation and Getting started told people
to `npm install @take-a-tour/core` without saying whether the package was
published (both gained an explicit publication-status callout, updated when
0.1.0 shipped), and Migration demonstrated an upgrade check against `0.2.0`,
which does not exist (now `npm outdated`/`npm ls`, with an explanation that
there is no upgrade to perform yet). Configuration gained an "Images and video"
section documenting the only supported way to put media in a step — `unsafeHTML:
true` plus `unsafeContent` — including the security boundary and the absence of
a first-class media field.

Lighthouse 13.6.0, real Chrome, against the built site over the same static
server the browser tests use:

| Page / preset | Perf | A11y | Best practices | SEO | Notes |
| ------------- | ---- | ---- | -------------- | --- | ----- |
| Docs (configuration), mobile | 74 | 100 | 100 | 100 | console errors 0; LCP 1.8 s, TBT 1.47 s |
| Home, desktop | 87 | 100 | 100 | 100 | LCP 0.7 s, CLS 0.014, TBT 0.3 s |
| Home, mobile | 64 | 100 | 100 | 100 | LCP 3.1 s, TBT 2.29 s (4× CPU throttling) |

Performance is the one category that will not reach 100 with this
architecture. The site is a confirmed JSX build, so every route ships the React
runtime and hydrates islands; under Lighthouse's mobile CPU throttle, hydration
and style/layout dominate and TBT alone caps the score. The site's lab numbers
are healthy (LCP under a second on desktop, CLS at or near zero), and the
remaining weight is the agreed cost of the pure-JSX requirement, not a defect.
The other three categories are 100 on every page measured.

---

## Phase 11 — Public release · complete

- **Node 24 in CI.** Astro 7 requires Node >=22.22.0; the workflows pinned
  Node 20, so `astro build` exited before producing the site. Both workflows now
  use Node 24, and the monorepo engine requirement was raised to match. The
  published core package keeps `node >=18.18.0`.
- **npm resolution on GitHub Actions.** `pack-check.mjs` and
  `consumer-install-test.mjs` assumed npm lived next to the Node binary. They
  now prefer `npm_execpath` (set by `npm run`) and fall back to npm on PATH.
- **Spotlight test stability.** The layout test scrolls the target into view,
  starts the tour with `scrollIntoView: false`, and waits two animation frames
  before measuring, removing a CI-only scroll race.
- **Documentation deployed.** GitHub Pages serves the project site at
  <https://thinakaranmanokaran.github.io/take_a_tour/>. All 27 routes, assets,
  sitemap, robots.txt, `.nojekyll` and the designed 404 respond under
  `/take_a_tour/`.
- **Library published.** `@take-a-tour/core@0.1.0` is public on npm with zero
  runtime dependencies. A clean registry install was verified for ESM, CommonJS,
  the CSS export and types.
- **Accidental root package removed.** The root package `take-a-tour-monorepo`
  was deleted from the registry by its owner. The workspace root was renamed to
  `take-a-tour` and remains `"private": true`, so it cannot be published by
  accident again.

---

## Bugs found across all phases

Twenty-five implementation bugs — nine in the library and sixteen in the site —
each caught by a check that was run before the fix:

| # | Bug | Severity |
| - | --- | -------- |
| 1 | Destroyed tour not unregistered → `tourId` could never be reused | High |
| 2 | First step ignored by `target.missing: "skip"` | Medium |
| 3 | `start()` resolved instead of rejecting when cancelled by `destroy()` | Medium |
| 4 | Two overlays in the DOM when a tour was displaced | High |
| 5 | Concurrent `start()` calls raced into an illegal transition | Medium |
| 6 | `scorePlacement` returned `NaN`, disabling all placement fallback | High |
| 7 | Rapid `next()` could paint a superseded step | Medium |
| 8 | Escape key fired after `destroy()` | Medium |
| 9 | Live region created even with `announce: false` | Low |
| 10 | 18 in-prose links missed the `/take_a_tour/` base path (one also pointed at an old route) — every one would have 404'd on the real host | High |
| 11 | The search dialog cancelled its own index fetch; the first Ctrl+K never resolved | Medium |
| 12 | The heading-id build step truncated the built HTML before `<main>` | High |
| 13 | `--text-subtle` in both themes and white-on-primary in dark failed axe contrast | Medium |
| 14 | Scrollable code blocks and tables were not keyboard-focusable | Low |
| 15 | The sample-app mock used an `<h4>`, breaking heading order (Lighthouse audit) | Low |
| 16 | Light-mode code blocks inherited the page ink colour — dark-on-dark code was invisible | High |
| 17 | Tour accent overrides were declared at `:root`, where the library's per-root tokens shadow them — every demo tour stayed indigo | Medium |
| 18 | The customiser's accent control had never restyled a running tour (the same shadowing); it now does | Medium |
| 19 | Search-result selection equalled the surface colour in dark — the active row was invisible | Low |
| 20 | The 404 digits lost their brand colour to a higher-specificity paragraph rule | Low |
| 21 | The rail's re-open control, `position: fixed` inside the sticky rail, was painted beneath page content in Chromium — immune to `z-index` | Medium |
| 22 | The collapsed three-column rule meant for docs also matched the site layout, leaving a phantom grid track (an empty strip beside the content) | Low |
| 23 | The docs TOC island read headings during its first client render although the server rendered none — two React `#418` hydration mismatches per documentation page | Medium |
| 24 | Installation and Getting started told readers to install from npm without saying the package has never been published | Medium |
| 25 | Migration demonstrated an upgrade check against a version (`0.2.0`) that does not exist | Low |

Plus two test bugs where **the library was correct** and the assertion was not:
the `scrollIntoView` interaction, and fractional-pixel spotlight tolerance.

---

## Known limitations

Stated honestly. None of these are covered by tests.

1. **Shadow DOM is not pierced.** `querySelectorAll` cannot cross a shadow
   boundary. Pass `target.element` instead. Not implemented, not tested.
2. **Cross-origin iframes are not supported.** Not implemented.
3. **Spotlight motion is not GPU-composited.** The cut-out animates `top`,
   `left`, `width` and `height` — the simplest robust implementation. Smooth for
   typical target sizes; a deliberate simplicity trade-off, not a claim of
   pixel-perfect motion through transformed ancestors.
4. **Reduced motion collapses transitions to 1ms** rather than removing them
   entirely, to keep the end state reliable across engines.
5. **Conditional steps are evaluated once per run.** Changing a `when`
   predicate mid-tour has no effect until the tour restarts.
6. **Playwright covers Chromium only.** One engine proves the layout maths;
   adding more multiplies runtime without testing new logic.
7. **Automated accessibility checks are not WCAG conformance.** Full validation
   requires manual testing with real assistive technology and expert review,
   which has not been performed.
8. **The repository path contains a space** (`Take a Tour`). Everything works,
   but some toolchains are known to be sensitive to spaces in absolute paths.
   If a third-party tool misbehaves, this is the first thing to change.
9. **The site ships a React runtime on every page.** The confirmed JSX
   requirement means even reading-only documentation loads ~200 kB of
   JavaScript for the shared islands. Measured in Phase 8 and accepted; on the
   home page the library itself is still fetched only on first interaction.

---

## Remaining work

Optional, and not blocking a usable library:

- **Visual regression screenshots.** The UI is verified structurally and
  behaviourally, but there is no pixel-diff baseline.
- **Additional browsers.** Firefox and WebKit in the Playwright matrix.
- **Framework examples beyond React and Vue.** Angular is documented with a
  correct snippet but has no runnable project.
- **`tour.update()` render hooks.** Deliberately omitted; documented as a
  non-goal rather than left as a gap.