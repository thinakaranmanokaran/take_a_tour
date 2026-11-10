/**
 * Documentation site structure — single source of truth.
 *
 * The sidebar, pager, breadcrumbs, footer, sitemap and search index are all
 * derived from this list, so a section that appears in navigation is a page
 * that exists on disk. `href` values are base-free paths; every consumer runs
 * them through `url()` from `../config/site.js`.
 */

export const DOCS = [
  {
    href: "/docs/",
    title: "Overview",
    description: "What Take a Tour is, and what it deliberately is not.",
    group: "start",
  },
  {
    href: "/docs/getting-started/",
    title: "Getting started",
    description: "Install, mark a target, run your first tour.",
    group: "start",
  },
  {
    href: "/docs/installation/",
    title: "Installation",
    description: "npm, pnpm, yarn, bundlers and TypeScript setup.",
    group: "start",
  },
  {
    href: "/docs/quick-start/",
    title: "Quick start",
    description: "The smallest useful tour, end to end.",
    group: "start",
  },
  {
    href: "/docs/core-concepts/",
    title: "Core concepts",
    description: "One engine, JSON configuration, one design system.",
    group: "concepts",
  },
  {
    href: "/docs/configuration/",
    title: "JSON configuration",
    description: "Tour and step options, defaults, and precedence rules.",
    group: "concepts",
  },
  {
    href: "/docs/target-identifiers/",
    title: "Target identifiers",
    description: "data-tour-id, dots, duplicates, and why they are data.",
    group: "concepts",
  },
  {
    href: "/docs/lifecycle/",
    title: "Tour lifecycle",
    description: "idle → running → paused → terminal states.",
    group: "concepts",
  },
  {
    href: "/docs/navigation/",
    title: "Navigation",
    description: "next, previous, goTo, looping, conditional steps.",
    group: "concepts",
  },
  {
    href: "/docs/components/",
    title: "Built-in components",
    description: "Overlay, spotlight, tooltip, modal, progress, controls.",
    group: "guides",
  },
  {
    href: "/docs/themes/",
    title: "Themes and styling",
    description: "Light, dark, system, and the full token list.",
    group: "guides",
  },
  {
    href: "/docs/customization/",
    title: "Customization",
    description: "CSS variables, class overrides, custom actions.",
    group: "guides",
  },
  {
    href: "/docs/events/",
    title: "Events and callbacks",
    description: "The eleven lifecycle events and their payloads.",
    group: "guides",
  },
  {
    href: "/docs/dynamic-dom/",
    title: "Dynamic DOM integration",
    description: "SPAs, late targets, route changes, missing elements.",
    group: "guides",
  },
  {
    href: "/docs/persistence/",
    title: "Persistence",
    description: "Opt-in progress storage, adapters, resume.",
    group: "guides",
  },
  {
    href: "/docs/accessibility/",
    title: "Accessibility",
    description: "Keyboard, focus, announcements, reduced motion.",
    group: "guides",
  },
  {
    href: "/docs/security/",
    title: "Security",
    description: "textContent, the one opt-in, and what is never done.",
    group: "guides",
  },
  {
    href: "/docs/api/",
    title: "API reference",
    description: "Every exported method, option, type and error.",
    group: "reference",
  },
  {
    href: "/docs/frameworks/",
    title: "Framework integration",
    description: "React, Vue, Angular, and vanilla lifecycle rules.",
    group: "guides",
  },
  {
    href: "/playground/",
    title: "Playground",
    description: "Edit JSON and watch the real library run.",
    group: "start",
  },
  {
    href: "/docs/troubleshooting/",
    title: "Troubleshooting",
    description: "Real error messages and what they mean.",
    group: "reference",
  },
  {
    href: "/docs/migration/",
    title: "Migration and versioning",
    description: "Semver policy and upgrade notes.",
    group: "reference",
  },
  {
    href: "/changelog/",
    title: "Changelog",
    description: "What changed, and when.",
    group: "reference",
  },
];

/**
 * Public (non-documentation) pages, in header order. Shown in the site
 * navigation rail on every public page; the current page's sections are
 * nested underneath its entry at runtime.
 */
export const PUBLIC_PAGES = [
  { href: "/", title: "Home" },
  { href: "/docs/", title: "Docs" },
  { href: "/playground/", title: "Playground" },
  { href: "/examples/", title: "Examples" },
  { href: "/about/", title: "About" },
  { href: "/changelog/", title: "Changelog" },
];

export const GROUPS = [
  { id: "start", label: "Getting started" },
  { id: "concepts", label: "Concepts" },
  { id: "guides", label: "Guides" },
  { id: "reference", label: "Reference" },
];

export function docsInGroup(group) {
  return DOCS.filter((doc) => doc.group === group);
}

export function findDoc(href) {
  return DOCS.find((doc) => doc.href === href);
}

/** Neighbouring pages, for the footer navigation. */
export function neighbours(href) {
  const index = DOCS.findIndex((doc) => doc.href === href);
  return {
    previous: index > 0 ? DOCS[index - 1] : null,
    next: index >= 0 && index < DOCS.length - 1 ? DOCS[index + 1] : null,
  };
}
