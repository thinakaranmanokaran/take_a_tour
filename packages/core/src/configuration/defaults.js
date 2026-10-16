/**
 * Built-in configuration defaults.
 *
 * Every documented option appears here, so `getNormalizedConfig()` is always
 * exhaustive and the precedence rules are easy to reason about.
 */

import { DEFAULT_LABELS, Z_INDEX } from "../constants.js";

export const DEFAULT_CONFIG = Object.freeze({
  // identity
  tourId: null,

  // content
  steps: [],
  intro: null,
  completion: null,

  // behaviour
  startAt: 0,
  loop: false,
  scrollIntoView: true,
  closeOnEscape: true,
  closeOnOverlayClick: false,
  keyboardNavigation: true,
  allowTargetInteraction: false,
  waitForTarget: true,

  // presentation
  theme: "system",
  animation: "smooth",
  spotlight: true,
  spotlightPadding: 6,
  spotlightRadius: 8,
  showProgress: true,
  showStepCounter: false,
  showCloseButton: true,
  tooltipWidth: 320,
  zIndex: Z_INDEX.base,

  // placement
  placement: "bottom",
  offset: Object.freeze({ x: 0, y: 12 }),

  // targeting
  target: Object.freeze({
    missing: "wait",
    timeout: 3000,
    occurrence: "error",
  }),

  // concurrency — one active tour per document by default
  concurrency: "pause-previous",

  // persistence — disabled unless explicitly enabled
  persistence: Object.freeze({
    enabled: false,
    adapter: "memory",
    key: null,
    resume: false,
    resetOnComplete: false,
  }),

  // a11y
  announce: true,

  // extensibility
  labels: DEFAULT_LABELS,
  classes: Object.freeze({}),
  debug: false,
  unsafeHTML: false,

  // callbacks
  on: Object.freeze({}),
});

/** Options that `tour.update()` is permitted to change after creation. */
export const UPDATABLE_OPTIONS = Object.freeze([
  "theme",
  "animation",
  "spotlight",
  "showProgress",
  "showStepCounter",
  "showCloseButton",
  "tooltipWidth",
  "offset",
  "placement",
  "scrollIntoView",
  "closeOnEscape",
  "closeOnOverlayClick",
  "keyboardNavigation",
  "allowTargetInteraction",
  "labels",
  "classes",
  "zIndex",
  "target",
  "concurrency",
  "persistence",
  "announce",
  "completion",
  "intro",
  "steps",
  "loop",
  "on",
  "debug",
  "unsafeHTML",
]);

/** Options that are fixed once a tour is created. */
export const IMMUTABLE_OPTIONS = Object.freeze(["tourId"]);
