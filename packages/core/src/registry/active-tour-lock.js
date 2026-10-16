/**
 * Document-level active tour lock.
 *
 * Concurrency policy for the first release: **one active tour per document**.
 * Two live overlays would fight over the spotlight, the z-index stack, and the
 * focus trap, and the failure modes are confusing rather than loud.
 *
 * When a second tour starts, the configured policy decides what happens to the
 * tour already on screen:
 *
 *   pause-previous  (default) — pause A, run B, resume A when B ends
 *   stop-previous             — stop A, run B
 *   reject                    — throw; the caller decides what to do
 */

import { TransitionError } from "../errors/index.js";

let activeTour = null;
/** @type {{ instance: object, resumeAfter: boolean }|null} */
let suspended = null;

export function getActiveTour() {
  return activeTour;
}

export function isActive(tourId) {
  return activeTour?.tourId === tourId;
}

/**
 * Claim the document lock for `instance`.
 *
 * @param {object} instance
 * @param {'pause-previous'|'stop-previous'|'reject'} policy
 */
export function claimActive(instance, policy) {
  if (activeTour === instance) return { displaced: null };

  if (!activeTour) {
    activeTour = instance;
    suspended = null;
    return { displaced: null };
  }

  const previous = activeTour;

  switch (policy) {
    case "reject":
      throw new TransitionError(
        `Tour "${previous.tourId}" is already running and the concurrency policy is "reject". ` +
          "Finish or destroy it first, or use a different `concurrency` policy.",
        { method: "start" }
      );

    case "stop-previous":
      previous.stop("replaced");
      break;

    case "pause-previous":
    default:
      suspended = { instance: previous, resumeAfter: true };
      // `displaced` makes the tour release its overlay instead of dimming it.
      previous.pause("displaced");
      break;
  }

  activeTour = instance;
  return { displaced: previous };
}

/** Release the lock. Returns the tour that should be resumed, if any. */
export function releaseActive(instance) {
  if (activeTour !== instance) {
    if (suspended?.instance === instance) suspended = null;
    return null;
  }

  activeTour = null;

  if (suspended && suspended.instance !== instance) {
    const toResume = suspended.instance;
    suspended = null;
    return toResume;
  }

  suspended = null;
  return null;
}

/** The tour that was paused to make room, if any. */
export function getSuspendedTour() {
  return suspended?.instance ?? null;
}

export function __resetLock() {
  activeTour = null;
  suspended = null;
}
