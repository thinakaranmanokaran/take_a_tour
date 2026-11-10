/**
 * Playground presets.
 *
 * One module so the starter configuration cannot drift: the playground island
 * runs it, the "Starting code" section on the page prints it, and the preset
 * menu offers it by name.
 */

export const STARTER = `{
  "tourId": "playground",
  "theme": "system",
  "placement": "bottom",
  "showProgress": true,
  "steps": [
    {
      "tourId": "play.nav",
      "title": "Start here",
      "content": "This panel is a live preview. Press Next to move on.",
      "placement": "right"
    },
    {
      "tourId": "play.card",
      "title": "Real DOM targets",
      "content": "The spotlight is a real element positioned with getBoundingClientRect.",
      "placement": "bottom"
    },
    {
      "tourId": "play.cta",
      "title": "The end",
      "content": "Edit the JSON and press Start again to see your changes."
    }
  ]
}`;

export const DEFAULT_CSS = `:root {
  /* Uncomment and edit any token below. */
  /* --tat-color-primary: #0ea5e9; */
  /* --tat-tooltip-width: 380px; */
  /* --tat-radius-lg: 6px; */
}`;

const MINIMAL = `{
  "tourId": "playground.minimal",
  "steps": [
    {
      "tourId": "play.cta",
      "title": "One step",
      "content": "The smallest valid tour: one step that points at one element."
    }
  ]
}`;

const NO_SPOTLIGHT = `{
  "tourId": "playground.spotlight-off",
  "spotlight": false,
  "showProgress": false,
  "steps": [
    {
      "tourId": "play.card",
      "title": "Spotlight off",
      "content": "Without the spotlight the tooltip simply points at the target.",
      "placement": "bottom"
    }
  ]
}`;

const CENTERED = `{
  "tourId": "playground.centered",
  "steps": [
    {
      "title": "Centred step",
      "content": "A step with no target runs as a centred modal.",
      "centered": true
    }
  ]
}`;

export const PRESETS = [
  { id: "starter", label: "Starter tour (3 steps)", config: STARTER },
  { id: "minimal", label: "Minimal (one step)", config: MINIMAL },
  { id: "spotlight-off", label: "Spotlight off", config: NO_SPOTLIGHT },
  { id: "centered", label: "Centred modal step", config: CENTERED },
];
