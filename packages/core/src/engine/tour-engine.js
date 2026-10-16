/**
 * Tour engine.
 *
 * Owns the lifecycle state machine, step navigation, target acquisition and
 * event emission. It knows nothing about individual UI components — it drives
 * a renderer through a narrow contract instead.
 *
 * Concurrency and race safety
 * ----------------------------
 * Navigation is asynchronous because target resolution may wait for the DOM.
 * Two hazards follow, and both are handled explicitly here:
 *
 *   - Stale work: a navigation started for step 2 must not paint over step 3 if
 *     the user clicked Next twice. Each navigation takes a monotonically
 *     increasing sequence number and abandons itself when superseded.
 *   - Post-destroy work: an in-flight wait must not resolve into a destroyed
 *     tour. An AbortSignal is aborted on destroy, and every continuation checks
 *     the lifecycle state before touching anything.
 */

import { STATES } from "../constants.js";
import { TakeATourError, TransitionError } from "../errors/index.js";
import { createStateMachine } from "../state/state-machine.js";
import { createNavigator, resolveActiveSteps } from "../navigation/navigator.js";
import { resolveStepTarget } from "../targets/missing-target.js";
import { normalizeConfig } from "../configuration/normalize.js";
import { UPDATABLE_OPTIONS, IMMUTABLE_OPTIONS } from "../configuration/defaults.js";
import { createEmitter } from "../utilities/emitter.js";
import { claimActive, releaseActive } from "../registry/active-tour-lock.js";
import { unregisterTour } from "../registry/tour-registry.js";
import { createPersistenceAdapter } from "../persistence/index.js";

/**
 * @param {object} params
 * @param {object} params.config normalized, frozen configuration
 * @param {object} params.renderer
 * @param {object} [params.logger]
 */
export function createTourEngine({ config: initialConfig, renderer, logger }) {
  /** Replaced wholesale by `update()`; never mutated. */
  let config = initialConfig;

  let instance = null;

  const emitter = createEmitter({
    onError: (error, { event }) => {
      // A throwing listener is reported once, without recursing into `error`.
      if (event === "error") {
        logger?.error("An `error` listener threw:", error);
        return;
      }
      emitError(error, { event });
    },
  });

  const abortController = typeof AbortController === "function" ? new AbortController() : null;
  const machine = createStateMachine();

  let activeSteps = [];
  let navigator = null;
  /** Current rendered context, kept so `refresh()` can re-present it. */
  let currentContext = null;
  let navSequence = 0;
  let starting = null;
  let emittingError = false;
  let holdsLock = false;

  const persistence = createPersistenceAdapter({
    settings: config.persistence,
    tourId: config.tourId,
    logger,
  });

  // ---------------------------------------------------------------- helpers

  const getInstance = () => instance;
  const isLive = () => machine.getState() !== STATES.DESTROYED;

  /**
   * Keep `config.on` callbacks registered as ordinary listeners, so consumer
   * callbacks and `tour.on()` handlers share one dispatch path (and therefore
   * the same error isolation). Rebound on update so a replaced callback does
   * not accumulate alongside the old one.
   */
  function syncConfigCallbacks(previous, next) {
    if (previous === next) return;
    for (const [event, handler] of Object.entries(previous?.on ?? {})) {
      if (typeof handler === "function") emitter.off(event, handler);
    }
    for (const [event, handler] of Object.entries(next?.on ?? {})) {
      if (typeof handler === "function") emitter.on(event, handler);
    }
  }

  syncConfigCallbacks(null, config);

  function assertLive(method) {
    if (!isLive()) {
      throw new TransitionError(
        `Cannot call ${method}() after destroy(). Create a new tour instead.`,
        { from: STATES.DESTROYED, method }
      );
    }
  }

  function assertRunning(method) {
    if (!machine.is(STATES.RUNNING, STATES.PAUSED)) {
      throw new TransitionError(
        `Cannot call ${method}() while the tour is "${machine.getState()}".`,
        {
          from: machine.getState(),
          method,
        }
      );
    }
  }

  /** Take a navigation token; `isStale()` tells us if we were superseded. */
  function beginNavigation() {
    const sequence = ++navSequence;
    const lifecycleAtStart = machine.getState();
    return {
      isStale: () =>
        sequence !== navSequence || machine.getState() !== lifecycleAtStart || !isLive(),
    };
  }

  function emitError(error, extra = {}) {
    if (emittingError) return;
    emittingError = true;
    try {
      void emitter.emit("error", {
        error: error instanceof Error ? error : new Error(String(error)),
        tourId: config.tourId,
        ...extra,
      });
    } finally {
      emittingError = false;
    }
  }

  function describeCurrent() {
    const entry = navigator?.current ?? null;
    return {
      step: entry?.step ?? null,
      index: navigator?.position ?? -1,
      stepIndex: entry?.index ?? -1,
      total: activeSteps.length,
    };
  }

  const currentStepIndex = () => navigator?.current?.index ?? -1;

  // -------------------------------------------------------------- lifecycle

  /**
   * Start the tour.
   *
   * Repeated calls while a start is in flight resolve to the same promise rather
   * than starting twice, which makes a double-clicked "Start tour" button
   * harmless. `starting` is assigned synchronously, before `doStart` reaches its
   * first `await`, so two calls in the same tick cannot both proceed.
   */
  async function start(options = {}) {
    assertLive("start");

    if (starting) return starting;
    if (machine.getState() === STATES.RUNNING) return getInstance();
    if (machine.getState() === STATES.PAUSED) {
      resume();
      return getInstance();
    }

    starting = doStart(options).finally(() => {
      starting = null;
    });
    return starting;
  }

  async function doStart(options) {
    claimActive(getInstance(), config.concurrency);
    holdsLock = true;

    try {
      activeSteps = await resolveActiveSteps(config);
      navigator = createNavigator({ config, activeSteps });

      if (activeSteps.length === 0) {
        throw new TakeATourError(
          "Every step was excluded by its `when` predicate, so there is nothing to show.",
          { code: "TAT_NO_STEPS" }
        );
      }

      const startPosition = resolveStartPosition(options);
      const entry = navigator.at(startPosition);

      machine.transition("start");
      renderer.mount({ tourId: config.tourId });

      await emitter.emit("start", {
        tour: getInstance(),
        step: entry.step,
        index: startPosition,
        stepIndex: entry.index,
        total: activeSteps.length,
      });

      await presentFrom(startPosition, { initial: true });
    } catch (error) {
      // A failed start must not leave the document locked or the overlay up.
      if (machine.is(STATES.RUNNING, STATES.PAUSED)) {
        try {
          machine.transition("stop");
        } catch {
          /* already terminal */
        }
      }
      renderer.unmount?.();
      releaseLock();
      throw error;
    }

    return getInstance();
  }

  function resolveStartPosition(options) {
    const restored =
      config.persistence.enabled && config.persistence.resume && !options.ignorePersistence
        ? persistence.load()
        : null;

    if (restored && typeof restored.stepIndex === "number" && restored.stepIndex > 0) {
      const entry = activeSteps.find((item) => item.index === restored.stepIndex);
      if (entry) {
        const position = navigator.positionForStepId(entry.step.tourId);
        if (position >= 0) return position;
      }
    }

    return navigator.initialPosition();
  }

  /**
   * Pause the tour.
   *
   * Two kinds of pause, with different visual consequences:
   *   user      — the UI stays on screen, dimmed and non-interactive.
   *   displaced — another tour took over the document, so this one releases
   *               its overlay entirely. Two roots in the DOM would mean two
   *               dialogs for a screen reader and an unpredictable tab order.
   */
  function pause(reason = "user") {
    assertLive("pause");
    if (machine.getState() !== STATES.RUNNING) return getInstance();

    machine.transition("pause");

    if (reason === "displaced") {
      renderer.unmount?.();
    } else {
      renderer.setPaused?.(true);
    }

    void emitter.emit("pause", { tour: getInstance(), reason, ...describeCurrent() });
    return getInstance();
  }

  function resume() {
    assertLive("resume");
    if (machine.getState() !== STATES.PAUSED) return getInstance();

    machine.transition("resume");

    // A tour that was displaced released its overlay; rebuild it before
    // re-presenting the step it was showing.
    if (!renderer.mounted) {
      renderer.mount({ tourId: config.tourId });
      if (currentContext) {
        try {
          renderer.present(buildContext(currentContext));
        } catch (error) {
          emitError(error, { stage: "resume" });
        }
      }
    }

    renderer.setPaused?.(false);
    void emitter.emit("resume", { tour: getInstance(), ...describeCurrent() });
    return getInstance();
  }

  function stop(reason = "user") {
    assertLive("stop");
    if (!machine.is(STATES.RUNNING, STATES.PAUSED, STATES.IDLE)) return getInstance();
    machine.transition("stop");
    renderer.unmount?.();
    currentContext = null;
    releaseLock();
    persistence.save({ completed: false, stepIndex: currentStepIndex() });
    void emitter.emit("stop", { tour: getInstance(), reason, ...describeCurrent() });
    return getInstance();
  }

  function skip(reason = "user") {
    assertLive("skip");
    if (!machine.is(STATES.RUNNING, STATES.PAUSED)) return getInstance();
    machine.transition("skip");
    renderer.unmount?.();
    currentContext = null;
    releaseLock();
    persistence.save({ completed: false, stepIndex: currentStepIndex() });
    void emitter.emit("skip", { tour: getInstance(), reason, ...describeCurrent() });
    return getInstance();
  }

  function complete() {
    assertLive("complete");
    if (!machine.is(STATES.RUNNING, STATES.PAUSED)) return getInstance();
    machine.transition("complete");
    renderer.unmount?.();
    currentContext = null;
    releaseLock();
    persistence.save({ completed: true, stepIndex: currentStepIndex() });
    void emitter.emit("complete", { tour: getInstance(), ...describeCurrent() });
    return getInstance();
  }

  function destroy() {
    if (!isLive()) return getInstance();

    // Invalidate in-flight navigation before tearing anything down.
    navSequence += 1;
    abortController?.abort();

    machine.transition("destroy");
    renderer.unmount?.();
    currentContext = null;
    activeSteps = [];
    navigator = null;
    releaseLock();

    try {
      void emitter.emit("destroy", { tour: getInstance() });
    } finally {
      emitter.destroy();
      persistence.dispose();
      // A destroyed instance must free its tourId, otherwise re-creating a tour
      // with the same id would fail as a duplicate.
      const instance = getInstance();
      if (instance) unregisterTour(instance);
    }
    return getInstance();
  }

  function releaseLock() {
    if (!holdsLock) return;
    holdsLock = false;
    const toResume = releaseActive(getInstance());
    // Only restore the tour we displaced, and only if it is still paused.
    if (toResume && toResume !== getInstance() && typeof toResume.is === "function") {
      if (toResume.is(STATES.PAUSED)) {
        try {
          toResume.resume();
        } catch {
          /* the displaced tour may have been destroyed by its owner */
        }
      }
    }
  }

  // -------------------------------------------------------------- navigation

  async function next() {
    assertLive("next");
    assertRunning("next");
    const target = navigator.nextPosition();
    if (target === -1) {
      complete();
      return getInstance();
    }
    return navigateTo(target);
  }

  async function previous() {
    assertLive("previous");
    assertRunning("previous");
    const target = navigator.previousPosition();
    if (target === -1) return getInstance();
    return navigateTo(target);
  }

  async function goTo(stepId) {
    assertLive("goTo");
    assertRunning("goTo");
    const target = navigator.positionForStepId(stepId);
    if (target === -1) {
      throw new TakeATourError(
        `No step with the identifier "${stepId}" exists in tour "${config.tourId}".`,
        {
          code: "TAT_UNKNOWN_STEP",
        }
      );
    }
    return navigateTo(target);
  }

  /**
   * Present a position, stepping over steps whose missing-target strategy is
   * `skip`.
   *
   * @returns {Promise<"presented"|"stale"|"completed"|"exhausted">}
   */
  async function presentFrom(startPosition, { initial = false } = {}) {
    let target = startPosition;
    let hops = 0;

    while (hops <= activeSteps.length) {
      const outcome = await presentStep(target, { initial });
      if (outcome !== "skipped") return outcome;

      hops += 1;
      // Everything from here on was skipped and there is nowhere left to go.
      if (target >= activeSteps.length - 1) {
        if (initial) {
          // A tour whose very first step vanished has nothing to show.
          throw new TakeATourError(
            "Every step was skipped because its target could not be found.",
            { code: "TAT_NO_STEPS" }
          );
        }
        return "completed";
      }
      target += 1;
    }

    return "exhausted";
  }

  /** Move to a position for a user-initiated navigation. */
  async function navigateTo(position) {
    const outcome = await presentFrom(position);
    if (outcome === "completed") complete();
    return getInstance();
  }

  /**
   * Present a single position.
   *
   * @returns {Promise<"presented"|"skipped"|"stale">}
   */
  async function presentStep(position, { initial = false } = {}) {
    const token = beginNavigation();
    const previousPosition = navigator.position;

    navigator.moveTo(position);
    const entry = navigator.at(position);

    await emitter.emit("beforeStep", {
      tour: getInstance(),
      step: entry.step,
      index: position,
      stepIndex: entry.index,
      previousIndex: previousPosition,
      initial,
    });

    if (token.isStale()) return "stale";

    let target = null;
    let spotlight = false;

    try {
      const resolution = await resolveStepTarget({
        step: entry.step,
        config,
        signal: abortController?.signal,
      });
      if (token.isStale()) return "stale";
      if (resolution.skipped) return "skipped";
      target = resolution.element;
      spotlight = resolution.spotlight;
    } catch (error) {
      // A start that is cancelled (for example by destroy) must reject rather
      // than silently resolve, or a caller awaiting start() would believe the
      // tour is running when it is not.
      if (token.isStale()) {
        if (initial) throw error;
        return "stale";
      }

      // A missing target ends the run: a tour pointing at nothing is worse
      // than no tour at all.
      if (machine.is(STATES.RUNNING, STATES.PAUSED)) {
        try {
          machine.transition("stop");
        } catch {
          /* already terminal */
        }
      }
      renderer.unmount?.();
      currentContext = null;
      releaseLock();
      emitError(error, {
        step: entry.step,
        index: position,
        stepIndex: entry.index,
        phase: "target",
      });
      if (initial) throw error;
      return "skipped";
    }

    const context = buildContext({ entry, position, target, spotlight });

    try {
      renderer.present(context);
    } catch (error) {
      emitError(error, { stage: "render", index: position });
    }

    if (token.isStale()) return "stale";

    currentContext = context;

    await emitter.emit("stepChange", {
      tour: getInstance(),
      step: entry.step,
      index: position,
      stepIndex: entry.index,
      previousIndex: previousPosition,
      total: activeSteps.length,
    });

    await emitter.emit("afterStep", {
      tour: getInstance(),
      step: entry.step,
      index: position,
      stepIndex: entry.index,
      total: activeSteps.length,
    });

    if (config.persistence.enabled) {
      persistence.save({ stepIndex: entry.index, completed: false });
    }

    return "presented";
  }

  function buildContext({ entry, position, target, spotlight }) {
    const isFirst = navigator.position === 0;
    const isLast = navigator.position === activeSteps.length - 1;

    return {
      tour: getInstance(),
      step: entry.step,
      entry,
      config,
      position,
      index: entry.index,
      total: activeSteps.length,
      target,
      spotlight: spotlight && config.spotlight,
      navigation: {
        isFirst,
        isLast,
        canGoPrevious: navigator.hasPrevious() || config.loop,
        canGoNext: navigator.hasNext() || config.loop,
        isLastStep: isLast,
      },
    };
  }

  // ------------------------------------------------------------------ config

  /**
   * Merge a partial configuration into the running tour.
   *
   * The result is re-validated and re-frozen, so an invalid `update()` is
   * rejected and the tour keeps its previous configuration intact.
   */
  function update(partialConfig) {
    assertLive("update");

    if (partialConfig === null || typeof partialConfig !== "object") {
      throw new TakeATourError("update() requires a partial configuration object.", {
        code: "TAT_CONFIG",
      });
    }

    for (const key of IMMUTABLE_OPTIONS) {
      if (key in partialConfig && partialConfig[key] !== config[key]) {
        throw new TakeATourError(`\`${key}\` cannot be changed after a tour is created.`, {
          code: "TAT_CONFIG",
          path: key,
        });
      }
    }

    const unknown = Object.keys(partialConfig).filter((key) => !UPDATABLE_OPTIONS.includes(key));
    if (unknown.length) {
      throw new TakeATourError(
        `update() received unsupported option${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}.`,
        { code: "TAT_CONFIG", path: unknown[0], expected: UPDATABLE_OPTIONS, received: unknown }
      );
    }

    // Validate against the merged result before committing, so a rejected
    // update leaves the tour exactly as it was.
    const candidate = { ...config, ...partialConfig };
    const nextConfig = normalizeConfig(candidate, {});
    const previous = config;
    config = nextConfig;
    syncConfigCallbacks(previous, nextConfig);

    if (nextConfig.theme !== previous.theme) renderer.setTheme?.(nextConfig.theme);

    if (machine.is(STATES.RUNNING, STATES.PAUSED) && currentContext) {
      try {
        renderer.refresh(buildContext(currentContext));
      } catch (error) {
        emitError(error, { stage: "refresh" });
      }
    }

    return getInstance();
  }

  function setTheme(theme) {
    assertLive("setTheme");
    return update({ theme });
  }

  // --------------------------------------------------------------------- API

  const engine = {
    /** Bound by the public API layer to the instance handed back to callers. */
    setInstance(value) {
      instance = value;
    },
    getInstance,

    getConfig: () => config,
    getState: () => machine.getState(),
    getCurrentStep: () => navigator?.current?.step ?? null,
    getCurrentStepIndex: () => navigator?.position ?? -1,
    getCurrentStepSourceIndex: () => currentStepIndex(),
    getSteps: () => activeSteps.map((item) => item.step),
    isActive: () => machine.isActive(),
    isPaused: () => machine.is(STATES.PAUSED),

    start,
    next,
    previous,
    goTo,
    pause,
    resume,
    stop,
    skip,
    complete,
    destroy,
    update,
    setTheme,
    resetProgress: () => persistence.clear(),

    on: (event, handler) => emitter.on(event, handler),
    once: (event, handler) => emitter.once(event, handler),
    off: (event, handler) => emitter.off(event, handler),

    /** Test seam: pending listener count, used to assert teardown. */
    __emitter: emitter,
  };

  return engine;
}
