/**
 * The eight examples on `/examples`.
 *
 * Each entry pairs a real tour configuration (run by `ExampleShell`) with the
 * JavaScript a reader would write to reproduce it. The code shown is generated
 * from the configuration itself, so the demo and the snippet can never drift.
 */

const IMPORT_LINES = `import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";`;

/** JSON is a subset of JavaScript — unquote the keys to print idiomatic code. */
function unquoteKeys(json) {
  return json.replace(/^(\s*)"([A-Za-z_$][\w$]*)":/gm, "$1$2:");
}

function tourCode(config, { after = "", before = "" } = {}) {
  const body = unquoteKeys(JSON.stringify(config, null, 2));
  return `${IMPORT_LINES}

${before}const tour = createTour(${body});

${after}tour.start();`;
}

export const EXAMPLES = [
  {
    id: "basic",
    title: "Basic three-step tour",
    tag: "Start here",
    description:
      "The smallest useful tour: three steps, exact targeting and a progress bar. Everything else is a default.",
    docHref: "/docs/getting-started/",
    docLabel: "Getting started",
    panel: "dashboard",
    prefix: "ex.basic",
    codeTitle: "basic.js",
    config: {
      tourId: "example.basic",
      showProgress: true,
      steps: [
        {
          tourId: "ex.basic.title",
          title: "Your overview",
          content: "Every demo on this page is the real package running against real DOM elements.",
          placement: "bottom-start",
        },
        {
          tourId: "ex.basic.search",
          title: "Search anything",
          content: "One data-tour-id attribute is all a step needs to find its target.",
          placement: "bottom",
        },
        {
          tourId: "ex.basic.create",
          title: "Create a project",
          content:
            "Finish here — the overlay, listeners and scroll locks are removed automatically.",
          placement: "bottom-end",
        },
      ],
    },
  },
  {
    id: "dashboard",
    title: "Dashboard onboarding",
    tag: "Dashboard",
    description:
      "A four-step flow across a dense interface: sidebar, metric cards, a data table, then the primary action.",
    docHref: "/docs/core-concepts/",
    docLabel: "Core concepts",
    panel: "dashboard",
    prefix: "ex.dashboard",
    codeTitle: "dashboard.js",
    config: {
      tourId: "example.dashboard",
      showProgress: true,
      showStepCounter: true,
      animation: "smooth",
      steps: [
        {
          tourId: "ex.dashboard.nav",
          title: "Start with navigation",
          content: "Orient people first: where they are, and where everything else lives.",
          placement: "right",
        },
        {
          tourId: "ex.dashboard.metrics",
          title: "The numbers that matter",
          content: "Metric cards answer whether the product is working — a natural second step.",
          placement: "top",
        },
        {
          tourId: "ex.dashboard.table",
          title: "Working data",
          content: "Dense tables are fine: the spotlight highlights without hiding the context.",
          placement: "top",
        },
        {
          tourId: "ex.dashboard.create",
          title: "And the action",
          content: "End on the primary action you want a new user to take.",
          placement: "bottom-end",
        },
      ],
    },
  },
  {
    id: "form",
    title: "Form walkthrough",
    tag: "Forms",
    description:
      "Steps follow the fields in the order people fill them: email, role, then the invite button.",
    docHref: "/docs/lifecycle/",
    docLabel: "Step lifecycle",
    panel: "form",
    prefix: "ex.form",
    codeTitle: "form.js",
    config: {
      tourId: "example.form",
      showProgress: true,
      steps: [
        {
          tourId: "ex.form.email",
          title: "Who are you inviting?",
          content: "Step through the fields in the order people fill them.",
          placement: "right",
        },
        {
          tourId: "ex.form.role",
          title: "Pick a role",
          content: "A short explanation here beats a tooltip attached to the label.",
          placement: "right",
        },
        {
          tourId: "ex.form.invite",
          title: "Send it",
          content: "The last step points at the button that completes the task.",
          placement: "top",
        },
      ],
    },
  },
  {
    id: "dark",
    title: "Dark-theme tour",
    tag: "Theming",
    description:
      'theme: "dark" pins the tour to the dark token set, whatever the visitor\'s system preference is.',
    docHref: "/docs/themes/",
    docLabel: "Themes",
    panel: "dashboard",
    prefix: "ex.dark",
    codeTitle: "dark.js",
    config: {
      tourId: "example.dark",
      theme: "dark",
      showProgress: true,
      steps: [
        {
          tourId: "ex.dark.title",
          title: "Themed, not restyled",
          content: "The dark token set covers surfaces, text, borders, shadows and the spotlight.",
          placement: "bottom-start",
        },
        {
          tourId: "ex.dark.metrics",
          title: "One theme per tour",
          content: "Set theme on the tour, and every step follows it.",
          placement: "top",
        },
        {
          tourId: "ex.dark.table",
          title: "Or per step",
          content: "A single step can override the tour theme when one screen needs it.",
          placement: "top",
          theme: "system",
        },
      ],
    },
  },
  {
    id: "tooltip",
    title: "Custom tooltip styling",
    tag: "Styling",
    description:
      "classes.tooltip merges onto the library's own class names, so a few CSS variables restyle the whole tooltip.",
    docHref: "/docs/customization/",
    docLabel: "Customization",
    panel: "dashboard",
    prefix: "ex.tooltip",
    codeTitle: "tooltip.js",
    config: {
      tourId: "example.tooltip",
      classes: { tooltip: "ex-fancy-tooltip" },
      showProgress: true,
      steps: [
        {
          tourId: "ex.tooltip.create",
          title: "A restyled tooltip",
          content:
            "No fork and no !important: the class is merged onto .tat-tooltip, and the tokens do the rest.",
          placement: "bottom-end",
        },
        {
          tourId: "ex.tooltip.metrics",
          title: "Tokens still apply",
          content: "Override --tat-* variables inside your class and every internal part follows.",
          placement: "top",
        },
      ],
    },
    extraCode: {
      lang: "css",
      title: "custom.css",
      code: `.ex-fancy-tooltip {
  --tat-color-surface: #f0fdfa;
  --tat-color-border: #99f6e4;
  --tat-color-text: #134e4a;
  --tat-color-text-muted: #0f766e;
  --tat-color-primary: #0d9488;
  --tat-color-primary-hover: #0f766e;
  --tat-radius-lg: 4px;
  --tat-shadow-lg: 0 14px 32px -10px rgb(13 148 136 / 0.4);
}`,
    },
  },
  {
    id: "missing",
    title: "Missing targets",
    tag: "Robustness",
    description:
      'What happens when a target is not in the DOM. Here target.missing: "skip" advances straight past the missing step — the default is "wait", which polls for up to three seconds first.',
    docHref: "/docs/target-identifiers/",
    docLabel: "Target identifiers",
    panel: "dashboard",
    prefix: "ex.missing",
    codeTitle: "missing.js",
    config: {
      tourId: "example.missing",
      target: { missing: "skip" },
      showProgress: true,
      steps: [
        {
          tourId: "ex.missing.title",
          title: "First step, present",
          content: "This target exists, so this step behaves normally.",
          placement: "bottom-start",
        },
        {
          tourId: "ex.missing.ghost",
          title: "Never rendered",
          content: "This target does not exist anywhere on the page.",
          placement: "bottom",
        },
        {
          tourId: "ex.missing.metrics",
          title: "The tour continues",
          content: "skip moved straight past the missing step — no error, no stall.",
          placement: "top",
        },
      ],
    },
  },
  {
    id: "responsive",
    title: "Narrow and responsive layouts",
    tag: "Layout",
    description:
      "The same tour in a deliberately narrow container. Placement flips when space runs out, and a live resize repositions the spotlight.",
    docHref: "/docs/configuration/",
    docLabel: "Placement options",
    panel: "dashboard",
    prefix: "ex.responsive",
    codeTitle: "responsive.js",
    className: "example--narrow",
    config: {
      tourId: "example.responsive",
      showProgress: true,
      steps: [
        {
          tourId: "ex.responsive.nav",
          title: "Narrow containers",
          content:
            "The panel below is constricted on purpose; the tooltip flips placement when space runs out.",
          placement: "right",
        },
        {
          tourId: "ex.responsive.table",
          title: "Resize while running",
          content:
            "Repositioning is observer-driven, so a live resize keeps the spotlight aligned.",
          placement: "top",
        },
        {
          tourId: "ex.responsive.create",
          title: "Same config everywhere",
          content: "Nothing in the configuration changes for small screens.",
          placement: "top-end",
        },
      ],
    },
  },
  {
    id: "programmatic",
    title: "Programmatic control",
    tag: "API",
    description:
      "goTo, pause, resume and destroy are public API. The buttons under this panel drive a running tour directly — no library UI involved.",
    docHref: "/docs/api/",
    docLabel: "API reference",
    panel: "dashboard",
    prefix: "ex.programmatic",
    codeTitle: "programmatic.js",
    mode: "programmatic",
    config: {
      tourId: "example.programmatic",
      showProgress: true,
      steps: [
        {
          tourId: "ex.programmatic.title",
          title: "Full control",
          content: "Every button under this panel calls the public API directly.",
          placement: "bottom-start",
        },
        {
          tourId: "ex.programmatic.metrics",
          title: "Any order",
          content: "goTo jumps to a named step regardless of sequence.",
          placement: "top",
        },
        {
          tourId: "ex.programmatic.table",
          title: "Pause, resume, destroy",
          content: "A tour can be paused mid-flow and resumed exactly where it left off.",
          placement: "top",
        },
      ],
    },
  },
];

// The displayed code, generated once from each configuration.
for (const example of EXAMPLES) {
  if (example.mode === "programmatic") {
    example.code = tourCode(example.config, {
      after: `// The buttons under the demo do exactly this:
//   tour.goTo("ex.programmatic.table");
//   tour.pause();
//   tour.resume();
//   tour.destroy();

`,
    });
  } else if (example.id === "missing") {
    example.code = tourCode(example.config, {
      after: `// target.missing can be "wait" (the default), "skip", "error" or "fallback".

`,
    });
  } else {
    example.code = tourCode(example.config);
  }
}

export const EXAMPLES_BY_ID = Object.fromEntries(EXAMPLES.map((example) => [example.id, example]));
