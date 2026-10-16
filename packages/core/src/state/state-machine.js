/**
 * Tour lifecycle state machine.
 *
 * The distinctions between stop, complete, skip and destroy are easy to blur
 * and expensive to get wrong, so they are modelled explicitly here rather than
 * being implied by whichever method happens to run.
 *
 *   stop     — the tour was ended by the host application or by the user
 *              closing it. It can be started again later.
 *   complete — the user reached the final step and finished.
 *   skip     — the user explicitly opted out via the skip control.
 *   destroy  — the instance is torn down. Its resources are released and the
 *              instance can never be used again.
 */

import { STATES } from "../constants.js";
import { TransitionError } from "../errors/index.js";

/** from-state → allowed target states. */
const TRANSITIONS = {
  [STATES.IDLE]: [STATES.RUNNING, STATES.STOPPED, STATES.DESTROYED],
  [STATES.RUNNING]: [
    STATES.PAUSED,
    STATES.COMPLETED,
    STATES.SKIPPED,
    STATES.STOPPED,
    STATES.DESTROYED,
  ],
  [STATES.PAUSED]: [
    STATES.RUNNING,
    STATES.COMPLETED,
    STATES.SKIPPED,
    STATES.STOPPED,
    STATES.DESTROYED,
  ],
  // Terminal states may only be destroyed, or restarted after an explicit stop.
  [STATES.COMPLETED]: [STATES.DESTROYED],
  [STATES.SKIPPED]: [STATES.DESTROYED],
  [STATES.STOPPED]: [STATES.RUNNING, STATES.DESTROYED],
  [STATES.DESTROYED]: [],
};

/** Public method → target state. Methods absent here are not transitions. */
const METHOD_TARGETS = {
  start: STATES.RUNNING,
  resume: STATES.RUNNING,
  pause: STATES.PAUSED,
  complete: STATES.COMPLETED,
  skip: STATES.SKIPPED,
  stop: STATES.STOPPED,
  destroy: STATES.DESTROYED,
};

/** States in which the tour owns the overlay and holds the document lock. */
const ACTIVE_STATES = new Set([STATES.RUNNING, STATES.PAUSED]);

export function createStateMachine({ onTransition } = {}) {
  let state = STATES.IDLE;
  const history = [state];

  function can(method) {
    const target = METHOD_TARGETS[method];
    if (!target) return false;
    return TRANSITIONS[state].includes(target);
  }

  function isActive() {
    return ACTIVE_STATES.has(state);
  }

  return {
    getState() {
      return state;
    },

    /**
     * Whether a given state is currently active.
     * @param {...string} states
     */
    is(...states) {
      return states.includes(state);
    },

    /** True while the tour is presenting (running or paused). */
    isActive,

    can,

    /**
     * Perform a transition.
     *
     * @param {keyof typeof METHOD_TARGETS} method
     * @throws {TransitionError} when the transition is not legal from here
     */
    transition(method) {
      const target = METHOD_TARGETS[method];
      if (!target) {
        throw new TransitionError(`"${method}" is not a lifecycle transition.`, { method });
      }
      if (state === STATES.DESTROYED) {
        throw new TransitionError(
          `Cannot call ${method}() after destroy(). Create a new tour instead.`,
          { from: state, to: target, method }
        );
      }
      if (!TRANSITIONS[state].includes(target)) {
        throw new TransitionError(`Cannot ${method}() while the tour is "${state}".`, {
          from: state,
          to: target,
          method,
        });
      }
      const previous = state;
      state = target;
      history.push(state);
      onTransition?.({ from: previous, to: target, method });
      return state;
    },

    get history() {
      return [...history];
    },
  };
}

export { METHOD_TARGETS, TRANSITIONS };
