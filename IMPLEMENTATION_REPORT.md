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
| Browser — docs site | `npm run test:browser:docs` | **11 passed** |
| Lint | `npm run lint` | clean |
| Format | `npm run format:check` | clean |
| Build | `npm run build` | CJS bundle written |
| Runtime dependency audit | `npm run check:deps` | zero runtime dependencies |
| Type declarations | `npm run typecheck:types` | `tsc --noEmit` clean |
| Package contents | `npm run pack:check` | 57 files, correct |
| Clean consumer install | `npm run test:consumer` | ESM + CJS + CSS + types all pass |
| Documentation build | `npm run docs:build` | 22 pages built |
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

## Bugs found across all phases

Nine implementation bugs, each caught by a test that was written first and run
before the fix:

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

---

## Remaining work

Not started, and not blocking a usable library:

- **Publishing to npm.** `@take-a-tour/core` returns 404 on the registry, but a
  scope needs an account to publish under. No release has been made and none
  will be without explicit authorisation.
- **Visual regression screenshots.** The UI is verified structurally and
  behaviourally, but there is no pixel-diff baseline.
- **Additional browsers.** Firefox and WebKit in the Playwright matrix.
- **Framework examples beyond React and Vue.** Angular is documented with a
  correct snippet but has no runnable project.
- **`tour.update()` render hooks.** Deliberately omitted; documented as a
  non-goal rather than left as a gap.