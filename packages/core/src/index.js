/**
 * Take a Tour — public entry point.
 *
 * ```js
 * import { createTour } from '@take-a-tour/core';
 * import '@take-a-tour/core/styles.css';
 *
 * const tour = createTour({
 *   tourId: 'home-onboarding',
 *   steps: [{ tourId: 'home.cta', title: 'Create a project', content: 'Start here.' }],
 * });
 *
 * tour.start();
 * ```
 *
 * The core package has zero runtime dependencies and makes no network requests.
 */

// --- primary API --------------------------------------------------------
export { createTour, configureTour } from "./public-api/create-tour.js";
export { destroyAllTours, getTour, hasTour, listTours } from "./registry/tour-registry.js";

// --- configuration ------------------------------------------------------
export { DEFAULT_CONFIG } from "./configuration/defaults.js";
export {
  ANIMATIONS,
  CONCURRENCY_POLICIES,
  EVENTS,
  MISSING_TARGET_STRATEGIES,
  PLACEMENTS,
  STATES,
  THEMES,
} from "./constants.js";

// --- errors -------------------------------------------------------------
export {
  StorageError,
  TakeATourError,
  TargetError,
  TourConfigError,
  TransitionError,
} from "./errors/index.js";

/** Package version, kept in sync with package.json. */
export const VERSION = "0.1.0";
