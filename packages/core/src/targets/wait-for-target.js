/**
 * Wait-for-target support for dynamically rendered steps.
 *
 * A SPA route change may mount the element seconds after `next()` is called.
 * Polling alone would be wasteful; MutationObserver alone would miss visibility
 * changes caused by class swaps. This uses both — the observer reacts to DOM
 * insertions, and a slow interval catches everything else.
 *
 * The wait is always cancellable, so `destroy()` during a pending wait cannot
 * leave a dangling observer or a late resolution.
 */

import { DATA_TOUR_ID } from "../constants.js";
import { TargetError } from "../errors/index.js";
import { isTargetUsable, resolveTargetElement } from "./resolver.js";

const POLL_INTERVAL = 60;

/**
 * Attempt to resolve a usable target, waiting up to `timeout` milliseconds.
 *
 * @param {object} params
 * @param {object} params.step
 * @param {object} params.config
 * @param {number} params.timeout
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{ element: Element, reason: string }>}
 * @throws {TargetError} on timeout or when aborted
 */
export function acquireTarget({ step, config, timeout, signal }) {
  // Immediate attempt first — the common case never sets up an observer.
  const immediate = resolveTargetElement(step, config);
  if (immediate.element && isTargetUsable(immediate.element)) {
    return Promise.resolve({ element: immediate.element, reason: immediate.reason });
  }
  if (immediate.reason === "centred") {
    return Promise.resolve({ element: null, reason: "centred" });
  }

  return waitForTarget({ step, config, timeout, signal });
}

function waitForTarget({ step, config, timeout, signal }) {
  return new Promise((resolve, reject) => {
    let settled = false;
    let observer = null;
    let intervalId = null;
    let timeoutId = null;

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      signal?.removeEventListener("abort", onAbort);
    };

    function finish(fn, value) {
      if (settled) return;
      settled = true;
      cleanup();
      fn(value);
    }

    function attempt() {
      if (settled) return;
      let result;
      try {
        result = resolveTargetElement(step, config);
      } catch (error) {
        // Ambiguity or an invalid selector will not fix itself over time.
        finish(reject, error);
        return;
      }
      if (result.element && isTargetUsable(result.element)) {
        finish(resolve, { element: result.element, reason: result.reason });
      }
    }

    function onAbort() {
      finish(
        reject,
        new TargetError("Waiting for a tour target was cancelled because the tour was destroyed.", {
          targetId: step?.tourId,
          reason: "aborted",
        })
      );
    }

    if (signal) {
      if (signal.aborted) {
        onAbort();
        return;
      }
      signal.addEventListener("abort", onAbort);
    }

    if (typeof MutationObserver === "function") {
      observer = new MutationObserver(attempt);
      observer.observe(document.documentElement ?? document, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: [DATA_TOUR_ID, "class", "style", "hidden", "aria-hidden"],
      });
    }

    intervalId = setInterval(attempt, POLL_INTERVAL);

    timeoutId = setTimeout(() => {
      finish(
        reject,
        new TargetError(
          `Timed out after ${timeout}ms waiting for ${step?.target?.selector ? `selector ${JSON.stringify(step.target.selector)}` : `target "${step?.tourId}"`} to become available.`,
          { targetId: step?.tourId, reason: "timeout", timeout }
        )
      );
    }, timeout);

    attempt();
  });
}
