/**
 * Step list resolution and navigation.
 *
 * Two related but separate concerns:
 *
 *   - `resolveActiveSteps` evaluates conditional (`when`) predicates. A step
 *     that does not apply is not an error; it simply is not part of this run.
 *     Predicates may be synchronous or asynchronous.
 *   - `createNavigator` tracks the position within the active steps and answers
 *     "where can I go from here?".
 *
 * Positions are tracked as indexes into the *active* list, while events report
 * both the active index and the original index in `config.steps`, so consumers
 * can always map back to their authored configuration.
 */

import { TourConfigError } from "../errors/index.js";

/**
 * @param {object} config normalized configuration
 * @returns {Promise<Array<{ step: object, index: number }>>}
 */
export async function resolveActiveSteps(config) {
  const entries = config.steps.map((step, index) => ({ step, index }));
  const included = [];

  for (const entry of entries) {
    let include = true;
    if (entry.step.when !== undefined) {
      const { when } = entry.step;
      try {
        include = typeof when === "function" ? await when() : Boolean(when);
      } catch (error) {
        throw new TourConfigError(
          `The \`when\` predicate for steps[${entry.index}] threw an error, so the step's ` +
            `inclusion is unknown: ${error.message}`,
          { path: `steps[${entry.index}].when`, cause: error }
        );
      }
    }
    if (include) included.push(entry);
  }

  return included;
}

export function createNavigator({ config, activeSteps }) {
  /** Index into `activeSteps`, or -1 before the tour starts. */
  let position = -1;
  /** Monotonic guard: stale async work compares against this before applying. */
  let revision = 0;

  const total = activeSteps.length;

  function clamp(index) {
    if (index < 0) return 0;
    if (index > total - 1) return total - 1;
    return index;
  }

  return {
    get total() {
      return total;
    },

    get position() {
      return position;
    },

    get revision() {
      return revision;
    },

    get current() {
      return position >= 0 ? activeSteps[position] : null;
    },

    at(index) {
      return activeSteps[clamp(index)];
    },

    /** Index in the active list for a step id, or -1. */
    indexOf(stepId) {
      return activeSteps.findIndex((entry) => entry.step.tourId === stepId);
    },

    hasNext() {
      return position < total - 1;
    },

    hasPrevious() {
      return position > 0;
    },

    /**
     * Next position, honouring `loop`.
     * @returns {number} -1 when there is nowhere to go
     */
    nextPosition() {
      if (position < total - 1) return position + 1;
      return config.loop && total > 0 ? 0 : -1;
    },

    previousPosition() {
      if (position > 0) return position - 1;
      return config.loop && total > 0 ? total - 1 : -1;
    },

    /** Resolve the position to start at. */
    initialPosition() {
      if (total === 0) return -1;

      const { startAt } = config;
      if (typeof startAt === "number") {
        if (startAt >= total) {
          throw new TourConfigError(
            `\`startAt\` is ${startAt} but the tour has ${total} step${total === 1 ? "" : "s"} after ` +
              "conditional steps were applied.",
            { path: "startAt", expected: `0..${total - 1}`, received: startAt }
          );
        }
        return clamp(startAt);
      }

      if (typeof startAt === "string") {
        const index = activeSteps.findIndex((entry) => entry.step.tourId === startAt);
        if (index === -1) {
          throw new TourConfigError(
            `\`startAt\` refers to "${startAt}", which is not a step identifier in this tour.`,
            { path: "startAt", expected: "a step identifier from `steps`", received: startAt }
          );
        }
        return index;
      }

      return 0;
    },

    /**
     * Jump to a step, skipping over optional steps when jumping by identifier.
     *
     * `goTo` is an explicit request from the host application, so it may bypass
     * `optional` steps. Forward navigation via `next()` never skips them.
     */
    positionForStepId(stepId) {
      const index = activeSteps.findIndex((entry) => entry.step.tourId === stepId);
      if (index === -1) return -1;
      return index;
    },

    moveTo(index) {
      position = clamp(index);
      revision += 1;
      return position;
    },

    reset() {
      position = -1;
      revision += 1;
    },
  };
}
