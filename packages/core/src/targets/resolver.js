/**
 * DOM target resolution.
 *
 * Design rule, from the architecture review: **a target identifier is data, not
 * a CSS selector.**
 *
 * The obvious approach — escape the identifier and interpolate it into
 * `[data-tour-id="home.cta"]` — uses the wrong escape domain. CSS identifier
 * escaping (`CSS.escape`) and CSS string escaping are different grammars, and
 * getting that wrong turns a target lookup into a syntax error or, worse, a
 * subtly wrong match.
 *
 * The approach used here sidesteps the problem entirely: the selector is a
 * constant string, so no user input ever reaches the CSS parser. Every candidate
 * carrying the attribute is collected, then compared by exact attribute value.
 * That makes identifiers such as `home.cta`, `settings.profile`,
 * `a"b`, and `100%` all resolve correctly, with nothing to escape.
 *
 * Known limitation: `querySelectorAll` does not pierce shadow roots. Targets
 * inside a shadow tree must be supplied with `target.element`.
 */

import { DATA_TOUR_ID } from "../constants.js";
import { TargetError, describeElement } from "../errors/index.js";
import { isElementHidden } from "../utilities/dom.js";

/**
 * Collect every element whose `data-tour-id` is exactly `targetId`.
 *
 * @param {string} targetId
 * @param {ParentNode} [root]
 * @returns {Element[]}
 */
export function findElementsByTargetId(targetId, root = document) {
  if (typeof targetId !== "string" || targetId === "") return [];

  // Constant selector — no interpolated input, therefore nothing to escape.
  const candidates = root.querySelectorAll(`[${DATA_TOUR_ID}]`);
  const matches = [];
  for (const element of candidates) {
    // Exact string comparison, not selector matching.
    if (element.getAttribute(DATA_TOUR_ID) === targetId) matches.push(element);
  }
  return matches;
}

/**
 * Resolve the elements for an explicit CSS selector.
 *
 * The selector is supplied by the developer, never by tour data. It is still
 * validated so a typo produces an actionable error rather than a silent miss.
 */
export function findElementsBySelector(selector, root = document) {
  let matches;
  try {
    matches = root.querySelectorAll(selector);
  } catch (error) {
    throw new TargetError(`Invalid CSS selector in \`target.selector\`: ${error.message}`, {
      reason: "invalid-selector",
    });
  }
  return [...matches];
}

/**
 * Resolve a step's target to a single element.
 *
 * @param {object} step normalized step
 * @param {object} config tour configuration (supplies the default occurrence policy)
 * @returns {{ element: Element|null, reason: string, matches: Element[] }}
 *   `reason` is one of: `resolved`, `missing`, `ambiguous`, `detached`, `hidden`,
 *   `centred`.
 * @throws {TargetError} only for programming errors such as an invalid selector
 */
export function resolveTargetElement(step, config) {
  // A centred dialog has no host element by design.
  const explicitElement = step?.target?.element;
  if (explicitElement) {
    if (!explicitElement.isConnected) {
      return { element: null, reason: "detached", matches: [] };
    }
    return { element: explicitElement, reason: "resolved", matches: [explicitElement] };
  }

  const selector = step?.target?.selector;
  if (selector) {
    const matches = findElementsBySelector(selector);
    return pickFromMatches(matches, step, config, `selector ${JSON.stringify(selector)}`);
  }

  if (!step?.tourId) {
    return { element: null, reason: "centred", matches: [] };
  }

  const matches = findElementsByTargetId(step.tourId);
  return pickFromMatches(matches, step, config, `target identifier "${step.tourId}"`);
}

/**
 * Apply the duplicate-handling policy to a set of matches.
 *
 * Silently taking the first match would hide a genuine authoring mistake, so
 * ambiguity is an error unless the step opts in explicitly.
 */
function pickFromMatches(matches, step, config, description) {
  const live = matches.filter((element) => element.isConnected);

  if (live.length === 0) return { element: null, reason: "missing", matches };

  const occurrence = step?.target?.occurrence ?? config?.target?.occurrence ?? "error";

  if (live.length === 1) return { element: live[0], reason: "resolved", matches: live };

  // More than one element carries the same identifier.
  if (occurrence === "first") return { element: live[0], reason: "resolved", matches: live };

  if (typeof occurrence === "number") {
    const chosen = live[occurrence];
    if (!chosen) {
      throw new TargetError(
        `${description} matched ${live.length} elements, but \`target.occurrence\` index ` +
          `${occurrence} is out of range.`,
        { targetId: step.tourId, reason: "missing", matches: live }
      );
    }
    return { element: chosen, reason: "resolved", matches: live };
  }

  throw new TargetError(
    `${description} matches ${live.length} elements: ` +
      `${live.map(describeElement).join(", ")}. ` +
      "Target identifiers must be unique. Fix the duplicate attribute, or set " +
      "`target.occurrence` to 'first' or an index on each step that shares it.",
    { targetId: step.tourId, reason: "ambiguous", matches: live }
  );
}

/**
 * Whether a resolved element is currently usable as a tour target.
 * Split from resolution so callers can decide whether `hidden` is fatal.
 */
export function isTargetUsable(element) {
  if (!element) return false;
  if (!element.isConnected) return false;
  if (isElementHidden(element)) return false;
  return true;
}

/**
 * Build a human-readable label for a resolved target, used in error messages.
 */
export function describeTarget(step, element) {
  if (element) return describeElement(element);
  if (step?.target?.selector) return `selector ${JSON.stringify(step.target.selector)}`;
  if (step?.tourId) return `target identifier "${step.tourId}"`;
  return "centred step";
}
