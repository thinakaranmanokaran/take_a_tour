# Take a Tour

Zero-dependency, framework-agnostic interactive product tours and contextual
onboarding for any website.

```bash
npm install @take-a-tour/core
```

```html
<button data-tour-id="home.cta">Create project</button>
```

```js
import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";

const tour = createTour({
  tourId: "home-onboarding",
  steps: [
    {
      tourId: "home.cta",
      title: "Create your first project",
      content: "Click here to get started.",
      placement: "bottom",
    },
  ],
});

tour.start();
```

## What this repository is

An npm-workspaces monorepo.

| Path                | Contents                                             |
| ------------------- | ---------------------------------------------------- |
| `packages/core`     | The published library — **zero runtime dependencies** |
| `apps/docs`         | Astro documentation site with a live playground      |
| `examples/`         | Vanilla, Vite, React, Vue and SPA-route integrations |

## Commands

The monorepo requires **Node 22.22 or newer** (the published `@take-a-tour/core`
package itself still supports Node 18.18+).

```bash
npm install

npm test              # 230 unit + integration tests (Vitest, jsdom)
npm run test:browser  # 36 real-browser tests (Playwright, Chromium)
npm run lint          # ESLint 9
npm run build         # CommonJS bundle
npm run check:deps    # assert zero runtime dependencies
npm run pack:check    # audit published files
npm run test:consumer # install the real tarball into a throwaway project
npm run docs:dev      # documentation site on :4321
npm run docs:build    # build the documentation site
npm run verify        # everything above that can run in one pass
```

### Running the examples

```bash
npm run dev -w @take-a-tour/example-vanilla   # :5171
npm run dev -w @take-a-tour/example-vite      # :5173
npm run dev -w @take-a-tour/example-react     # :5174
npm run dev -w @take-a-tour/example-vue       # :5175
npm run dev -w @take-a-tour/example-spa-route # :5176
```

## Documentation

The full guide lives in `apps/docs`:

- **Getting started** — install, mark a target, run a tour
- **[Playground](apps/docs/src/pages/playground.astro)** — edit JSON, watch the real library run
- **API reference** — every method, option, event and error
- **Security** — what the library guarantees, and the one place it does not

## Two kinds of identifier

The single most common source of confusion, so it is stated plainly:

- **Tour-level `tourId`** identifies the tour instance. Must be unique. Used for the registry and
  the persistence key.
- **Step-level `tourId`** identifies a **DOM target**, matched exactly against `data-tour-id`.
  Dots are ordinary characters: `home.cta` is one identifier, not a path.

Identifiers are compared as exact attribute values — never interpolated into a CSS selector — so
`home.cta`, `a"b`, `100%` and `[data-x]` all resolve correctly. Two elements sharing an
identifier raise an actionable error rather than being resolved arbitrarily.

## Zero dependencies, enforced

`npm run check:deps` fails the build if the core package gains a runtime dependency, or if its
source contains `innerHTML`, `eval`, `Function`, `fetch` or `XMLHttpRequest` outside the single,
explicitly named trusted-HTML module.

```
$ npm run check:deps

Runtime dependency audit — @take-a-tour/core

  ok  package.json: zero runtime, peer and optional dependencies
  ok  scanned 44 source files, 104 module specifiers

Zero runtime dependencies confirmed.
```

## Testing

| Suite                                     | Tool                     | Covers                                  |
| ----------------------------------------- | ------------------------ | --------------------------------------- |
| 230 unit + integration tests               | Vitest + jsdom           | Configuration, lifecycle, positioning maths, accessibility, security, persistence |
| 36 real-browser tests                      | Playwright + Chromium    | Real geometry, viewport flipping, scrolling, nested scroll containers, cleanup, axe-core |
| 11 documentation tests                     | Playwright + Chromium    | Proves the playground runs the real library |
| Clean consumer install                     | node                     | ESM import, `require()`, CSS export, `tsc` against the shipped types |

jsdom has no layout engine, so anything involving geometry is verified in a real browser.

## Known limitations

Stated honestly, and not covered by tests:

1. **Shadow DOM is not pierced.** `querySelectorAll` cannot cross a shadow boundary; pass
   `target.element` instead.
2. **Cross-origin iframes are not supported.**
3. **Spotlight motion is not GPU-composited** — it animates `top`/`left`/`width`/`height`, a
   deliberate simplicity trade-off.
4. **Conditional steps are evaluated once per run**, not on every navigation.
5. **Automated accessibility checks are not WCAG conformance.** Full validation needs manual
   testing with real assistive technology, which has not been performed.

## Release status

Not published. The package name `@take-a-tour/core` was unclaimed when checked, but the scope needs
an account to publish under, and no release has been made without explicit authorisation.

## License

MIT. Icon path data derived from [Lucide](https://lucide.dev) (ISC) — see
`packages/core/src/icons/ATTRIBUTION.md`.