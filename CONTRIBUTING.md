# Contributing

Thanks for considering a contribution to Take a Tour.

## Ground rules

The published core package has **zero runtime dependencies**. Any proposed change
that adds one will not be accepted without an exceptionally strong justification
recorded in the pull request.

Core implementation is plain JavaScript targeting modern browsers. No TypeScript
in the runtime source, no transpilation step for ESM consumers.

## Getting started

```bash
npm install
npm run verify
```

`verify` runs lint, formatting check, the unit suite, the build, the runtime
dependency audit, and the pack audit.

## Scripts

| Command                     | Purpose                                              |
| --------------------------- | ---------------------------------------------------- |
| `npm run lint`              | ESLint across the workspace                          |
| `npm run format`            | Prettier write                                       |
| `npm test`                  | Vitest unit + integration suite (jsdom)              |
| `npm run test:browser`      | Playwright real-browser suite                        |
| `npm run build`             | Build the CJS bundle for `@take-a-tour/core`         |
| `npm run check:deps`        | Assert the core has zero runtime dependencies        |
| `npm run pack:check`        | `npm pack --dry-run` file audit                      |
| `npm run docs:dev`          | Astro documentation site                             |
| `npm run docs:build`        | Build the documentation site                         |

Browser tests require a one-time setup:

```bash
npx playwright install chromium
```

## Change requirements

- **Tests must be run, not just written.** A change is not complete until the
  relevant suite has been executed and passes.
- Behavioural changes need unit tests. Anything involving real geometry
  (positioning, viewport overflow, scrolling, responsive layout, cleanup) needs
  a real-browser test as well — jsdom has no layout engine.
- Public API changes require updating `types/index.d.ts` and the API reference.
- Record verified behaviour, real test results, and known limitations in
  `IMPLEMENTATION_REPORT.md`.
- No placeholder implementations for core behaviour, and no core feature left as
  a TODO.

## Commit and PR style

Small, focused pull requests. Explain *why*, not only *what*. If you verified
something by running it, say so; if you did not, say that too.