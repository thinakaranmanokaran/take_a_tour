/**
 * Library-wide constants.
 *
 * Every class name and CSS custom property the library owns is prefixed so it
 * cannot collide with the host website's stylesheet.
 */

/** DOM attribute that marks a tour target. Treated as data, never as a selector. */
export const DATA_TOUR_ID = "data-tour-id";

/** Short namespace used for every library-owned class and variable. */
export const NS = "tat";

export const CLS = {
  root: `${NS}-root`,
  rootHidden: `${NS}-root--hidden`,
  overlay: `${NS}-overlay`,
  overlayVisible: `${NS}-overlay--visible`,
  spotlight: `${NS}-spotlight`,
  tooltip: `${NS}-tooltip`,
  tooltipHeader: `${NS}-tooltip__header`,
  tooltipTitle: `${NS}-tooltip__title`,
  tooltipContent: `${NS}-tooltip__content`,
  tooltipFooter: `${NS}-tooltip__footer`,
  tooltipBody: `${NS}-tooltip__body`,
  arrow: `${NS}-arrow`,
  modal: `${NS}-modal`,
  modalVisible: `${NS}-modal--visible`,
  progress: `${NS}-progress`,
  progressBar: `${NS}-progress__bar`,
  progressBarFill: `${NS}-progress__fill`,
  progressDots: `${NS}-progress__dots`,
  progressDot: `${NS}-progress__dot`,
  progressDotActive: `${NS}-progress__dot--active`,
  counter: `${NS}-counter`,
  controls: `${NS}-controls`,
  controlsGroup: `${NS}-controls__group`,
  btn: `${NS}-btn`,
  btnPrimary: `${NS}-btn--primary`,
  btnGhost: `${NS}-btn--ghost`,
  btnIcon: `${NS}-btn--icon`,
  btnSkip: `${NS}-btn--skip`,
  btnClose: `${NS}-btn--close`,
  btnPrevious: `${NS}-btn--previous`,
  btnNext: `${NS}-btn--next`,
  actions: `${NS}-actions`,
  live: `${NS}-live`,
  themeLight: `${NS}--light`,
  themeDark: `${NS}--dark`,
  entering: `${NS}--entering`,
  leaving: `${NS}--leaving`,
};

/**
 * Centralised z-index strategy.
 *
 * All library layers sit on one contiguous stack above normal application
 * content. Consumers override the whole stack at once with the `zIndex`
 * option; individual layers are not separately configurable.
 */
export const Z_INDEX = {
  base: 9990,
  overlay: 0,
  spotlight: 1,
  content: 2,
};

export const THEMES = ["light", "dark", "system"];

export const ANIMATIONS = ["none", "instant", "smooth"];

export const PLACEMENTS = [
  "top",
  "top-start",
  "top-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
  "right",
  "right-start",
  "right-end",
  "center",
];

export const STATES = {
  IDLE: "idle",
  RUNNING: "running",
  PAUSED: "paused",
  COMPLETED: "completed",
  SKIPPED: "skipped",
  STOPPED: "stopped",
  DESTROYED: "destroyed",
};

export const EVENTS = {
  START: "start",
  BEFORE_STEP: "beforeStep",
  STEP_CHANGE: "stepChange",
  AFTER_STEP: "afterStep",
  PAUSE: "pause",
  RESUME: "resume",
  SKIP: "skip",
  COMPLETE: "complete",
  STOP: "stop",
  ERROR: "error",
  DESTROY: "destroy",
};

/** Strategies applied when a step's target cannot be found. */
export const MISSING_TARGET_STRATEGIES = ["error", "skip", "wait", "fallback"];

/** Policies applied when another tour is already active in the document. */
export const CONCURRENCY_POLICIES = ["pause-previous", "reject", "stop-previous"];

export const DEFAULT_LABELS = {
  previous: "Previous",
  next: "Next",
  done: "Done",
  skip: "Skip tour",
  close: "Close tour",
  progress: "Step {current} of {total}",
  stepLabel: "Step",
};
