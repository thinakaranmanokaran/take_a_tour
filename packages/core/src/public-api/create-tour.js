/**
 * Public API — `createTour()`.
 *
 * This module is the only place that knows how a tour instance is assembled.
 * It validates and normalizes the configuration, builds the engine, wires the
 * renderer, registers the instance, and hands back a small, predictable facade.
 */

import { validateConfig } from "../configuration/validate.js";
import { normalizeConfig } from "../configuration/normalize.js";
import { createTourEngine } from "../engine/tour-engine.js";
import { assertRenderer, createManagedRenderer } from "../render/renderer.js";
import { registerTour } from "../registry/tour-registry.js";
import { createLogger } from "../utilities/logger.js";
import { createUiRenderer } from "../components/renderer.js";

/** Global defaults, set by `configureTour()`. */
const globalState = {
  defaults: {},
  concurrency: undefined,
};

/**
 * Set library-wide defaults.
 *
 * ```js
 * configureTour({ defaults: { theme: 'dark', animation: 'instant' } });
 * ```
 *
 * Per-tour configuration always wins over these values.
 *
 * @param {{ defaults?: object }} [options]
 */
export function configureTour(options = {}) {
  if (options === null || typeof options !== "object") {
    throw new TypeError("configureTour() requires an options object.");
  }
  if (options.defaults !== undefined) {
    if (options.defaults === null || typeof options.defaults !== "object") {
      throw new TypeError("configureTour({ defaults }) requires an object.");
    }
    globalState.defaults = { ...globalState.defaults, ...options.defaults };
  }
  return { defaults: { ...globalState.defaults } };
}

/** Read the current global defaults. */
export function getGlobalDefaults() {
  return { ...globalState.defaults };
}

/** Reset global defaults. Mainly useful in tests. */
export function resetGlobalConfig() {
  globalState.defaults = {};
}

/**
 * Create a tour.
 *
 * @param {object} rawConfig
 * @param {object} [internals]
 * @param {object} [internals.renderer] override the UI renderer
 * @param {boolean} [internals.register] set false to skip registry insertion
 * @returns {object} the tour instance
 */
export function createTour(rawConfig, internals = {}) {
  // Validate first so a bad configuration never reaches normalization, and so
  // the error a developer sees is about their input rather than our internals.
  validateConfig(rawConfig);

  const config = normalizeConfig(rawConfig, globalState.defaults);
  const logger = createLogger({ debug: config.debug, namespace: `take-a-tour:${config.tourId}` });

  // The managed wrapper owns the disposal stack that guarantees every listener,
  // observer and node a tour creates is released on unmount.
  const baseRenderer = internals.renderer ?? createUiRenderer(config);
  const renderer = createManagedRenderer(baseRenderer, {
    onError: (error) => logger.error("Renderer error:", error),
  });

  const engine = createTourEngine({ config, renderer, logger });
  assertRenderer(renderer);

  const instance = buildInstance(engine, config);
  engine.setInstance(instance);

  // The renderer's buttons need a way back into the engine, and the engine
  // needs to be able to reach the renderer's private UI state.
  if (typeof renderer.__bindControlHandlers === "function") {
    renderer.__bindControlHandlers(instance);
  }

  if (internals.register !== false) {
    registerTour(instance, { replace: Boolean(internals.replace) });
  }

  return instance;
}

/**
 * Build the facade returned to callers.
 *
 * Every method delegates to the engine, so there is exactly one implementation
 * of each behaviour and no duplicated state.
 */
function buildInstance(engine, config) {
  const instance = {
    /** Tour identity. Distinct from any step's target identifier. */
    tourId: config.tourId,

    // --- lifecycle -----------------------------------------------------
    start: (options) => engine.start(options),
    pause: (reason) => engine.pause(reason),
    resume: () => engine.resume(),
    stop: (reason) => engine.stop(reason),
    skip: (reason) => engine.skip(reason),
    complete: () => engine.complete(),
    destroy: () => engine.destroy(),

    // --- navigation ----------------------------------------------------
    next: () => engine.next(),
    previous: () => engine.previous(),
    goTo: (stepId) => engine.goTo(stepId),

    // --- inspection ----------------------------------------------------
    getState: () => engine.getState(),
    getCurrentStep: () => engine.getCurrentStep(),
    getCurrentStepIndex: () => engine.getCurrentStepIndex(),
    getCurrentStepSourceIndex: () => engine.getCurrentStepSourceIndex(),
    getSteps: () => engine.getSteps(),
    getConfig: () => engine.getConfig(),
    isActive: () => engine.isActive(),
    isPaused: () => engine.isPaused(),
    /** Convenience predicate for the internal lock, used by the registry. */
    is: (state) => engine.getState() === state,

    // --- mutation ------------------------------------------------------
    update: (partialConfig) => engine.update(partialConfig),
    setTheme: (theme) => engine.setTheme(theme),
    resetProgress: () => engine.resetProgress(),

    // --- events --------------------------------------------------------
    on: (event, handler) => engine.on(event, handler),
    once: (event, handler) => engine.once(event, handler),
    off: (event, handler) => engine.off(event, handler),
  };

  return instance;
}
