import { SITE, url } from "../../config/site.js";

/**
 * `/about` — purpose, technical philosophy, supported use cases and the
 * contribution approach. No company, team, customer or author details are
 * invented; everything claimed here is visible in the repository.
 */
export default function About() {
  return (
    <div className="page-narrow">
      <p className="eyebrow">About</p>
      <article className="content">
        <h1>Why Take a Tour exists</h1>
        <p className="lede">
          Take a Tour is a zero-dependency JavaScript library for interactive product tours — the
          in-product guidance people see when they first meet your interface.
        </p>

        <h2>Purpose</h2>
        <p>
          Most onboarding problems are the same problem: a first-time user cannot see where anything
          is. Tour libraries exist to solve it, but the common options either drag a framework along
          with them, assume one front-end stack, or leave the hard parts — positioning, focus,
          teardown — to the application.
        </p>
        <p>
          Take a Tour tries to be the smallest library that solves the problem properly. One HTML
          attribute marks a target, one JSON object describes the tour, one call starts it.
          Everything else — validation, positioning, spotlight geometry, keyboard handling, cleanup
          — is implemented in the library and covered by tests.
        </p>

        <h2>Technical philosophy</h2>
        <ul>
          <li>
            <strong>Plain JavaScript, nothing to compile.</strong> The package ships ESM source and
            a CommonJS bundle; browsers run it directly.
          </li>
          <li>
            <strong>Data over code.</strong> A tour is JSON, validated before anything renders — it
            can be stored, generated or shipped as a file.
          </li>
          <li>
            <strong>Exact targeting.</strong> <code>data-tour-id</code> is matched as a literal
            value, never as a CSS selector, and duplicates fail loudly with the offending
            identifiers named.
          </li>
          <li>
            <strong>No dependencies, enforced.</strong> The build fails if a runtime dependency is
            ever added.
          </li>
          <li>
            <strong>Accessibility is a requirement.</strong> Keyboard navigation, focus management,
            live-region announcements and reduced-motion support are part of the core, not an
            add-on.
          </li>
          <li>
            <strong>Styling through tokens.</strong> One stylesheet, CSS variables prefixed{" "}
            <code>--tat-</code>, every rule scoped under <code>.tat-root</code>.
          </li>
          <li>
            <strong>No network calls, ever.</strong> The library works offline, inside internal
            tools and under strict content-security policies.
          </li>
          <li>
            <strong>Cleanup is a contract.</strong> Overlay, listeners, observers and scroll locks
            are removed on completion, skip, stop or destroy — and a browser test asserts it.
          </li>
        </ul>

        <h2>Supported use cases</h2>
        <p>
          Anything with a first run: onboarding a new account, explaining a redesigned screen, or
          introducing a feature that shipped last week. In practice that means SaaS onboarding
          flows, admin dashboards, ERP interfaces, analytics products, feature announcements and
          internal business applications.
        </p>
        <p>
          The <a href={url("/examples/")}>examples page</a> runs eight of these patterns against the
          real library, and the <a href={url("/playground/")}>playground</a> lets you edit a
          configuration live.
        </p>

        <h2>Project status</h2>
        <p>
          Version 0.1.0 is complete and tested, but not yet published to npm — the source lives in
          the GitHub repository. The quality gates are real and run together: linting and
          formatting, a unit and integration suite, a real-browser Playwright suite against the
          built site, a zero-dependency audit and a package-content audit.
        </p>

        <h2>Contributing</h2>
        <p>
          Contributions are welcome through{" "}
          <a href={SITE.repoUrl}>GitHub issues and pull requests</a>. The ground rules are short:
          zero runtime dependencies, plain JavaScript, and tests for behaviour changes.
        </p>
        <p>
          The full workflow — <code>npm install</code>, then <code>npm run verify</code> — is in{" "}
          <a href={`${SITE.repoUrl}/blob/main/CONTRIBUTING.md`}>CONTRIBUTING.md</a>.
        </p>

        <h2>License</h2>
        <p>
          MIT. The licence text ships in the repository at{" "}
          <a href={`${SITE.repoUrl}/blob/main/LICENSE`}>LICENSE</a>.
        </p>
      </article>
    </div>
  );
}
