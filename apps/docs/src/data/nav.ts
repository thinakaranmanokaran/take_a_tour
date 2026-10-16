/**
 * Documentation site structure.
 *
 * Kept as one typed module so the sidebar, the previous/next links and the
 * search index are all derived from a single source of truth. A section that
 * exists in the sidebar is a section that exists on disk.
 */

export interface Doc {
  slug: string;
  title: string;
  description: string;
  group: "start" | "concepts" | "guides" | "reference";
}

export const DOCS: Doc[] = [
  {
    slug: "",
    title: "Overview",
    description: "What Take a Tour is, and what it deliberately is not.",
    group: "start",
  },
  {
    slug: "getting-started",
    title: "Getting started",
    description: "Install, mark a target, run your first tour.",
    group: "start",
  },
  {
    slug: "installation",
    title: "Installation",
    description: "npm, bundlers, CDN, and framework setups.",
    group: "start",
  },
  {
    slug: "quick-start",
    title: "Quick start",
    description: "The smallest useful tour, end to end.",
    group: "start",
  },
  {
    slug: "core-concepts",
    title: "Core concepts",
    description: "One engine, JSON configuration, one design system.",
    group: "concepts",
  },
  {
    slug: "configuration",
    title: "JSON configuration",
    description: "Every option, its default, and precedence rules.",
    group: "concepts",
  },
  {
    slug: "target-identifiers",
    title: "Target identifiers",
    description: "data-tour-id, dots, duplicates, and why they are data.",
    group: "concepts",
  },
  {
    slug: "lifecycle",
    title: "Tour lifecycle",
    description: "idle → running → paused → terminal states.",
    group: "concepts",
  },
  {
    slug: "navigation",
    title: "Navigation",
    description: "next, previous, goTo, looping, conditional steps.",
    group: "concepts",
  },
  {
    slug: "components",
    title: "Built-in components",
    description: "Overlay, spotlight, tooltip, modal, progress, controls.",
    group: "guides",
  },
  {
    slug: "themes",
    title: "Themes and styling",
    description: "Light, dark, system, and the full token list.",
    group: "guides",
  },
  {
    slug: "customization",
    title: "Customization",
    description: "CSS variables, class overrides, custom actions.",
    group: "guides",
  },
  {
    slug: "events",
    title: "Events and callbacks",
    description: "The eleven lifecycle events and their payloads.",
    group: "guides",
  },
  {
    slug: "dynamic-dom",
    title: "Dynamic DOM integration",
    description: "SPAs, late targets, route changes, missing elements.",
    group: "guides",
  },
  {
    slug: "persistence",
    title: "Persistence",
    description: "Opt-in progress storage, adapters, resume.",
    group: "guides",
  },
  {
    slug: "accessibility",
    title: "Accessibility",
    description: "Keyboard, focus, announcements, reduced motion.",
    group: "guides",
  },
  {
    slug: "security",
    title: "Security",
    description: "textContent, the one opt-in, and what is never done.",
    group: "guides",
  },
  {
    slug: "api-reference",
    title: "API reference",
    description: "Every exported method, option, type and error.",
    group: "reference",
  },
  {
    slug: "frameworks",
    title: "Framework integration",
    description: "React, Vue, Angular, and vanilla lifecycle rules.",
    group: "guides",
  },
  {
    slug: "playground",
    title: "Playground",
    description: "Edit JSON and watch the real library run.",
    group: "start",
  },
  {
    slug: "troubleshooting",
    title: "Troubleshooting",
    description: "Real error messages and what they mean.",
    group: "reference",
  },
  {
    slug: "migration",
    title: "Migration and versioning",
    description: "Semver policy and upgrade notes.",
    group: "reference",
  },
  {
    slug: "changelog",
    title: "Changelog",
    description: "What changed, and when.",
    group: "reference",
  },
];

export const GROUPS: { id: Doc["group"]; label: string }[] = [
  { id: "start", label: "Getting started" },
  { id: "concepts", label: "Concepts" },
  { id: "guides", label: "Guides" },
  { id: "reference", label: "Reference" },
];

export function docsInGroup(group: Doc["group"]) {
  return DOCS.filter((doc) => doc.group === group);
}

export function findDoc(slug: string) {
  return DOCS.find((doc) => doc.slug === slug);
}

/** Neighbouring pages, for the footer navigation. */
export function neighbours(slug: string) {
  const index = DOCS.findIndex((doc) => doc.slug === slug);
  return {
    previous: index > 0 ? DOCS[index - 1] : null,
    next: index >= 0 && index < DOCS.length - 1 ? DOCS[index + 1] : null,
  };
}
