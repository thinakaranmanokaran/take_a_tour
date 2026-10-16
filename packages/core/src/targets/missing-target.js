/**
 * Missing-target strategies.
 *
 * When a step's element cannot be found, the tour needs a documented way to
 * continue rather than silently breaking. The strategy is configurable per tour
 * (`target.missing`) and per step.
 *
 *   error    — throw a TargetError. Strict; surfaces the authoring mistake.
 *   skip     — advance past the step. The tour keeps its place in the sequence.
 *   wait     — wait for the target with a timeout, then throw on expiry.
 *   fallback — render the step centred, without a spotlight.
 */

import { TargetError, describeElement } from "../errors/index.js";
import { isTargetUsable, resolveTargetElement } from "./resolver.js";
import { acquireTarget } from "./wait-for-target.js";

/**
 * Resolve the element a step should point at, applying the strategy.
 *
 * @param {object} params
 * @param {object} params.step
 * @param {object} params.config
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{ element: Element|null, spotlight: boolean, skipped: boolean, reason: string }>}
 */
export async function resolveStepTarget({ step, config, signal }) {
  const strategy = step?.target?.missing ?? config.target.missing;
  const timeout = step?.timeout ?? config.target.timeout;
  const wantsWait = step?.waitForTarget ?? config.waitForTarget;

  // Centre-only steps never look for a host element.
  const quick = resolveTargetElement(step, config);
  if (quick.reason === "centred") {
    return { element: null, spotlight: false, skipped: false, reason: "centred" };
  }

  if (quick.element && isTargetUsable(quick.element)) {
    return { element: quick.element, spotlight: true, skipped: false, reason: "resolved" };
  }

  // Resolve without the "usable" check so ambiguity errors surface even for
  // elements that are currently hidden.
  let matches = [];
  try {
    matches = resolveTargetElement(step, config).matches;
  } catch {
    matches = [];
  }

  const isPresentButHidden = quick.element && !isTargetUsable(quick.element);
  const detail = isPresentButHidden
    ? `${describeElement(quick.element)} exists but is hidden`
    : "no element carries that target identifier";

  switch (strategy) {
    case "error":
      throw new TargetError(`Cannot show step "${step?.tourId ?? "(unnamed)"}": ${detail}.`, {
        targetId: step?.tourId,
        reason: isPresentButHidden ? "hidden" : "missing",
        matches,
      });

    case "fallback":
      return { element: null, spotlight: false, skipped: false, reason: "fallback" };

    case "skip":
      return { element: null, spotlight: false, skipped: true, reason: "skipped" };

    case "wait": {
      if (!wantsWait) {
        throw new TargetError(
          `Cannot show step "${step?.tourId ?? "(unnamed)"}": ${detail}, and \`waitForTarget\` is disabled.`,
          { targetId: step?.tourId, reason: "missing", matches }
        );
      }
      const acquired = await acquireTarget({ step, config, timeout, signal });
      return { element: acquired.element, spotlight: true, skipped: false, reason: "waited" };
    }

    default:
      throw new TargetError(`Unsupported \`target.missing\` strategy "${strategy}".`, {
        targetId: step?.tourId,
        reason: "missing",
      });
  }
}
