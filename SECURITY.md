# Security Policy

## Scope

`@take-a-tour/core` is a client-side browser library. It renders UI into the host
page, reads the DOM, and — only when explicitly configured — writes non-sensitive
progress flags to `localStorage`.

## Design guarantees

These are enforced by lint rules (`eslint.config.js`) and by the security test
suite, not just by convention:

- No `innerHTML`, `insertAdjacentHTML`, `eval`, or `Function` in `src/`.
- No `fetch`, `XMLHttpRequest`, or any other network access in `src/`.
- No analytics, telemetry, or hidden requests.
- No modification of global prototypes, global variables, or host page styles.
- No reading of form values, input content, or any application data.
- All ordinary text is inserted with `textContent`.
- Identifiers such as `home.cta` are treated as **data**, never interpolated
  into a CSS selector.

## Trusted HTML

Rich content is opt-in and explicitly named:

```js
// Only use with content you control. Never with user input or remote data.
tour.update({ unsafeHTML: { enabled: true } });
```

When enabled, the library will parse markup you supply. This is equivalent to
`innerHTML`: **it can execute scripts in some contexts and it can load remote
resources**. Do not enable it for data you did not author.

## Custom callbacks

`on.*` callbacks and `when` predicates are functions you supply. They run in the
host page with full access to everything the page can do. Errors thrown by them
are caught and reported through the `error` event; they cannot corrupt engine
state, but they are still your code.

## Persistence

Persistence is **disabled by default** and never stores personal data, form
values, or tokens. When enabled with the `localStorage` adapter, only the tour
id, completion flag, and current step index are stored under
`take-a-tour:{tourId}`. Storage failures (private mode, quota, disabled
cookies) are caught and degrade to in-memory state.

## Reporting a vulnerability

Please report suspected vulnerabilities privately. Do not open a public issue for
an unfixed vulnerability. Include a description, reproduction steps, and the
affected version.