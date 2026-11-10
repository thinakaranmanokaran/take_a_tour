import { useCallback, useEffect, useRef, useState } from "react";
import "@take-a-tour/core/styles.css";

/**
 * Shared tour lifecycle for every interactive demo on the site.
 *
 * 1. The library chunk is imported on first interaction — never at page load.
 * 2. The library allows one active tour per document (its registry lock), so
 *    starting a tour destroys the previous one first.
 * 3. Destroying on unmount means no overlay, listener or observer survives a
 *    navigation — the same contract the cleanup test asserts.
 *
 * The hook exposes plain state so each demo can render its own controls and a
 * status line for its live region.
 */

let corePromise = null;

function loadCore() {
  if (!corePromise) {
    corePromise = import("@take-a-tour/core");
  }
  return corePromise;
}

/** The theme the site is currently showing, for tours that should match it. */
function siteTheme() {
  if (typeof document === "undefined") return "system";
  const theme = document.documentElement.dataset.theme;
  return theme === "light" || theme === "dark" ? theme : "system";
}

export function useTour() {
  const tourRef = useRef(null);

  const [state, setState] = useState("idle");
  const [stepIndex, setStepIndex] = useState(-1);
  const [stepTitle, setStepTitle] = useState(null);
  const [totalSteps, setTotalSteps] = useState(0);
  const [error, setError] = useState(null);
  const [hasTour, setHasTour] = useState(false);

  const sync = useCallback(() => {
    const tour = tourRef.current;
    if (!tour) return;
    setState(tour.getState());
    setStepIndex(tour.getCurrentStepIndex());

    const step = tour.getCurrentStep();
    setStepTitle(step && typeof step.title === "string" ? step.title : null);
  }, []);

  const destroy = useCallback(() => {
    const tour = tourRef.current;
    tourRef.current = null;

    if (tour) {
      try {
        tour.destroy();
      } catch {
        /* already destroyed */
      }
    }

    setState("idle");
    setStepIndex(-1);
    setStepTitle(null);
    setHasTour(false);
  }, []);

  // Navigation unmounts the demo: the tour must not survive the page.
  useEffect(() => destroy, [destroy]);

  /**
   * Start a tour. Anything already running is destroyed first.
   *
   * @param {object} config  Tour configuration, validated by the library.
   * @param {object} [handlers] `onEvent(event, payload)` for status text.
   * @returns {Promise<object|null>} The tour instance, or null on failure.
   */
  const start = useCallback(
    async (config, { onEvent } = {}) => {
      destroy();
      setError(null);

      let createTour;
      let TourConfigError;
      try {
        const core = await loadCore();
        createTour = core.createTour;
        TourConfigError = core.TourConfigError;
      } catch {
        setError(new Error("The library chunk could not be loaded."));
        return null;
      }

      let tour;
      try {
        tour = createTour(config);
      } catch (configError) {
        let message = configError.message;
        if (configError instanceof TourConfigError && configError.path) {
          message += ` (at ${configError.path})`;
        }
        setError(new Error(message));
        onEvent?.("error", { error: configError });
        return null;
      }

      tourRef.current = tour;
      setTotalSteps(tour.getSteps().length);
      setHasTour(true);

      for (const event of ["start", "stepChange", "pause", "resume", "complete", "skip", "stop"]) {
        tour.on(event, (payload) => {
          sync();
          onEvent?.(event, payload);
        });
      }

      tour.on("error", (payload) => {
        sync();
        setError(payload.error instanceof Error ? payload.error : new Error(String(payload.error)));
        onEvent?.("error", payload);
      });

      try {
        await tour.start();
      } catch (startError) {
        setError(startError instanceof Error ? startError : new Error(String(startError)));
        sync();
        onEvent?.("error", { error: startError });
      }

      sync();
      return tour;
    },
    [destroy, sync]
  );

  const run = useCallback(
    async (action) => {
      const tour = tourRef.current;
      if (!tour) return;
      try {
        await action(tour);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError : new Error(String(actionError)));
      }
      sync();
    },
    [sync]
  );

  const next = useCallback(() => run((tour) => tour.next()), [run]);
  const previous = useCallback(() => run((tour) => tour.previous()), [run]);
  const complete = useCallback(() => run((tour) => tour.complete()), [run]);
  const skip = useCallback((reason) => run((tour) => tour.skip(reason)), [run]);
  const stop = useCallback((reason) => run((tour) => tour.stop(reason)), [run]);
  const goTo = useCallback((stepId) => run((tour) => tour.goTo(stepId)), [run]);
  const pause = useCallback((reason) => run((tour) => tour.pause(reason)), [run]);
  const resume = useCallback(() => run((tour) => tour.resume()), [run]);

  const setTheme = useCallback((theme) => {
    const tour = tourRef.current;
    if (!tour) return;
    try {
      tour.setTheme(theme);
    } catch (themeError) {
      setError(themeError instanceof Error ? themeError : new Error(String(themeError)));
    }
  }, []);

  const running = state === "running";
  const paused = state === "paused";
  const active = running || paused;
  const theme = siteTheme();
  const clearError = useCallback(() => setError(null), []);

  return {
    start,
    destroy,
    next,
    previous,
    complete,
    skip,
    stop,
    goTo,
    pause,
    resume,
    setTheme,
    clearError,
    state,
    running,
    paused,
    active,
    hasTour,
    stepIndex,
    stepTitle,
    totalSteps,
    error,
    theme,
  };
}
