# @take-a-tour/core

Zero-dependency, framework-agnostic interactive product tours and contextual
onboarding for any website.

- **No runtime dependencies.** No React, no jQuery, no Popper, no icon package,
  no CSS framework. Native DOM and native CSS only.
- **Configuration first.** Describe a tour as JSON-shaped data; mark targets in
  your HTML with `data-tour-id`.
- **Framework agnostic.** The same code works in plain HTML, React, Vue, Angular
  or Vite. No framework-specific build of the library exists.
- **Accessible by design.** Keyboard navigation, focus management, live-region
  announcements, reduced-motion support.

```bash
npm install @take-a-tour/core
```

## Quick start

**HTML** — mark what the tour should point at:

```html
<button data-tour-id="home.cta">Create project</button>
<nav data-tour-id="home.sidebar">...</nav>
```

**JavaScript:**

```js
import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";

const tour = createTour({
  tourId: "home-onboarding",
  steps: [
    {
      tourId: "home.cta",
      title: "Create your first project",
      content: "Start here to create a new project.",
      placement: "bottom",
    },
    {
      tourId: "home.sidebar",
      title: "Navigate your workspace",
      content: "Access all your modules from this sidebar.",
      placement: "right",
    },
  ],
  theme: "system",
  animation: "smooth",
});

tour.start();
```

## Two kinds of identifier

This trips people up, so it is worth stating plainly:

| Identifier     | Meaning                                                       |
| -------------- | ------------------------------------------------------------- |
| `tourId` (tour)   | Identifies **this tour instance**. Must be unique.          |
| `tourId` (step)   | Identifies a **DOM target**, matched against `data-tour-id`. |

A step's `tourId` is **data, never a CSS selector**. `home.cta` is one
identifier containing a dot — not a path. Identifiers containing `"`, `'`, `\`,
`%`, `[`, `]`, `:` or `*` all resolve correctly, because nothing from your
configuration ever reaches the CSS parser.

If two elements carry the same `data-tour-id`, the library **reports an error**
rather than silently highlighting the first one:

```
Target identifier "home.cta" matches 2 elements: <button id="a">, <button id="b">.
Target identifiers must be unique. Fix the duplicate attribute, or set
`target.occurrence` to 'first' or an index on each step that shares it.
```

## API

| Method                    | Purpose                                        |
| ------------------------- | ---------------------------------------------- |
| `createTour(config)`      | Create and validate a tour                     |
| `tour.start()`            | Start from the first step                      |
| `tour.next()`             | Advance                                        |
| `tour.previous()`         | Go back                                        |
| `tour.goTo(id)`           | Jump to a step by identifier                   |
| `tour.pause()`            | Pause without losing position                  |
| `tour.resume()`           | Resume                                         |
| `tour.stop(reason?)`      | End the tour; it can be started again          |
| `tour.skip(reason?)`      | The user explicitly opted out                  |
| `tour.complete()`         | Finished normally                              |
| `tour.destroy()`          | Release everything; the instance is unusable   |
| `tour.getState()`         | `idle \| running \| paused \| completed \| skipped \| stopped \| destroyed` |
| `tour.getCurrentStep()`   | The current step, or `null`                    |
| `tour.update(patch)`      | Change supported options at runtime            |
| `tour.setTheme(theme)`    | `light \| dark \| system`                      |
| `tour.on(event, fn)`      | Subscribe; returns an unsubscribe function     |

### Events

`start`, `beforeStep`, `stepChange`, `afterStep`, `pause`, `resume`, `skip`,
`complete`, `stop`, `error`, `destroy`.

They fire in this order:

```
start → beforeStep → stepChange → afterStep
```

A listener that throws cannot corrupt the engine: the error is caught and
re-emitted through `error`.

## When a target is missing

`target.missing` decides what happens:

| Strategy   | Behaviour                                                      |
| ---------- | -------------------------------------------------------------- |
| `wait`     | Wait for the element (default), then time out with an error    |
| `skip`     | Step past it and continue                                      |
| `fallback` | Show the step centred, without a spotlight                      |
| `error`    | Throw a `TargetError` naming the step and the problem          |

## Accessibility

- Anchored tooltips are **not** modal: focus moves in once, then Tab continues
  naturally through the page.
- Centred steps are real modals: focus is trapped and restored on close.
- Focus returns to whatever launched the tour, on completion, skip, stop or
  destroy.
- Each step is announced through a polite live region.
- `prefers-reduced-motion` and `animation: "none"` both disable transitions.
- Every control is a real `<button>` with an accessible name; icons are
  decorative.

## Security

All configuration text is inserted with `textContent`. The package contains no
`innerHTML` outside one explicitly named, opt-in module
(`components/content/unsafe-html.js`), no `eval`, no network access, and no
prototype or global mutation. See `SECURITY.md`.

## Known limitations

- Targets inside a **shadow root** must be passed with `target.element`;
  `querySelectorAll` cannot cross the boundary.
- **Iframe** targets are not supported.
- Spotlight movement animates `top`/`left`/`width`/`height` rather than being
  GPU-composited. This is a deliberate simplicity trade-off.

## License

MIT. Icon path data derived from [Lucide](https://lucide.dev) (ISC); see
`src/icons/ATTRIBUTION.md` in the repository.