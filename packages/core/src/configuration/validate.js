/**
 * Configuration validation.
 *
 * Hand-written rather than pulled from a library, because the published
 * package must have zero runtime dependencies.
 *
 * Every failure reports the configuration path that caused it, the expected
 * value, and what was received, so a mistake is fixable without reading source.
 */

import {
  ANIMATIONS,
  CONCURRENCY_POLICIES,
  MISSING_TARGET_STRATEGIES,
  PLACEMENTS,
  THEMES,
} from "../constants.js";
import { TourConfigError } from "../errors/index.js";
import { isPlainObject } from "../utilities/dom.js";

const PLACEMENT_SET = new Set(PLACEMENTS);
const THEME_SET = new Set(THEMES);
const ANIMATION_SET = new Set(ANIMATIONS);
const MISSING_SET = new Set(MISSING_TARGET_STRATEGIES);
const CONCURRENCY_SET = new Set(CONCURRENCY_POLICIES);
const ALIGNMENTS = new Set(["start", "center", "end"]);
const OCCURRENCES = new Set(["error", "first"]);

const EVENT_NAMES = new Set([
  "start",
  "beforeStep",
  "stepChange",
  "afterStep",
  "pause",
  "resume",
  "skip",
  "complete",
  "stop",
  "error",
  "destroy",
]);

/** Callback options whose value must be a function. */
const CALLBACK_KEYS = new Set([
  "when",
  "onClick",
  "beforeStep",
  "afterStep",
  "onEnter",
  "onLeave",
  "render",
]);

function fail(message, { path, expected, received }) {
  throw new TourConfigError(message, { path, expected, received });
}

function describe(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function checkEnum(value, allowed, path, label) {
  if (!allowed.has(value)) {
    fail(`${label} "${String(value)}" is not supported.`, {
      path,
      expected: [...allowed],
      received: value,
    });
  }
  return value;
}

function checkBoolean(value, path, label) {
  if (typeof value !== "boolean") {
    fail(`${label} must be a boolean.`, { path, expected: "boolean", received: describe(value) });
  }
  return value;
}

function checkString(value, path, label, { nonEmpty = true } = {}) {
  if (typeof value !== "string") {
    fail(`${label} must be a string.`, { path, expected: "string", received: describe(value) });
  }
  if (nonEmpty && value.trim() === "") {
    fail(`${label} must not be empty.`, { path, expected: "a non-empty string", received: value });
  }
  return value;
}

function checkNumber(value, path, label, { min = -Infinity, max = Infinity } = {}) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(`${label} must be a number.`, { path, expected: "number", received: describe(value) });
  }
  if (value < min || value > max) {
    fail(`${label} must be between ${min} and ${max}.`, {
      path,
      expected: `${min}..${max}`,
      received: value,
    });
  }
  return value;
}

function checkFunction(value, path, label) {
  if (typeof value !== "function") {
    fail(`${label} must be a function.`, { path, expected: "function", received: describe(value) });
  }
  return value;
}

function checkPlainObject(value, path, label) {
  if (!isPlainObject(value)) {
    fail(`${label} must be a plain object.`, {
      path,
      expected: "object",
      received: describe(value),
    });
  }
  return value;
}

/**
 * A step is "anchored" when it points at a host element, and "centered" when
 * it is a standalone dialog with no target.
 */
function isAnchoredStep(step) {
  return (
    Boolean(step.tourId) || Boolean(step.target && (step.target.selector || step.target.element))
  );
}

function validateStep(step, index) {
  const path = `steps[${index}]`;

  if (!isPlainObject(step)) {
    fail("Each step must be a plain object.", {
      path,
      expected: "object",
      received: describe(step),
    });
  }

  const anchored = isAnchoredStep(step);

  if (step.tourId !== undefined && step.tourId !== null) {
    checkString(step.tourId, `${path}.tourId`, "A step's target identifier");
  } else if (!anchored && !step.centered && step.placement !== "center") {
    fail(
      "A step must define a target identifier (`tourId`), a `target.selector`, " +
        "a `target.element`, or be explicitly marked as centred.",
      {
        path,
        expected: "tourId | target.selector | target.element | centered: true",
        received: Object.keys(step).join(", ") || "(empty step)",
      }
    );
  }

  if (anchored && !step.tourId && step.target?.element === undefined) {
    // Selector-based targeting is explicit and valid without a tourId.
  }

  if (step.title !== undefined && step.title !== null) {
    if (typeof step.title !== "string" && typeof step.title !== "function") {
      fail("Step `title` must be a string or a function returning a string.", {
        path: `${path}.title`,
        expected: "string | function",
        received: describe(step.title),
      });
    }
  }

  if (step.content !== undefined && step.content !== null) {
    if (typeof step.content !== "string" && typeof step.content !== "function") {
      fail("Step `content` must be a string or a function returning a string.", {
        path: `${path}.content`,
        expected: "string | function",
        received: describe(step.content),
      });
    }
  }

  if (step.title === undefined && step.content === undefined && !step.actions) {
    fail("A step needs `title`, `content`, or `actions` to be renderable.", {
      path,
      expected: "title | content | actions",
      received: "none",
    });
  }

  if (step.placement !== undefined) {
    checkEnum(step.placement, PLACEMENT_SET, `${path}.placement`, "Step `placement`");
  }

  if (step.align !== undefined) {
    checkEnum(step.align, ALIGNMENTS, `${path}.align`, "Step `align`");
  }

  if (step.offset !== undefined) {
    checkPlainObject(step.offset, `${path}.offset`, "Step `offset`");
    checkNumber(step.offset.x, `${path}.offset.x`, "Step `offset.x`");
    checkNumber(step.offset.y, `${path}.offset.y`, "Step `offset.y`");
  }

  if (step.theme !== undefined) {
    checkEnum(step.theme, THEME_SET, `${path}.theme`, "Step `theme`");
  }

  if (step.when !== undefined) {
    if (typeof step.when !== "boolean" && typeof step.when !== "function") {
      fail("Step `when` must be a boolean or a predicate function.", {
        path: `${path}.when`,
        expected: "boolean | function",
        received: describe(step.when),
      });
    }
  }

  for (const key of ["optional", "spotlight", "scrollIntoView", "waitForTarget", "centered"]) {
    if (step[key] !== undefined) checkBoolean(step[key], `${path}.${key}`, `Step \`${key}\``);
  }

  if (step.timeout !== undefined) {
    checkNumber(step.timeout, `${path}.timeout`, "Step `timeout`", { min: 0, max: 600000 });
  }

  for (const key of ["spotlightPadding", "spotlightRadius", "tooltipWidth"]) {
    if (step[key] !== undefined) {
      checkNumber(step[key], `${path}.${key}`, `Step \`${key}\``, { min: 0, max: 10000 });
    }
  }

  if (step.target !== undefined) {
    checkPlainObject(step.target, `${path}.target`, "Step `target`");
    const { selector, element, occurrence } = step.target;

    if (selector !== undefined && typeof selector !== "string") {
      fail("`target.selector` must be a string.", {
        path: `${path}.target.selector`,
        expected: "string",
        received: describe(selector),
      });
    }
    if (selector !== undefined && selector.trim() === "") {
      fail("`target.selector` must not be empty.", {
        path: `${path}.target.selector`,
        expected: "a non-empty CSS selector",
        received: selector,
      });
    }
    if (element !== undefined) {
      if (typeof element !== "object" || element.nodeType !== 1) {
        fail("`target.element` must be a DOM element.", {
          path: `${path}.target.element`,
          expected: "Element",
          received: describe(element),
        });
      }
    }
    if (selector !== undefined && element !== undefined) {
      fail("Use either `target.selector` or `target.element`, not both.", {
        path: `${path}.target`,
        expected: "one of selector | element",
        received: "both",
      });
    }
    if (
      occurrence !== undefined &&
      !OCCURRENCES.has(occurrence) &&
      typeof occurrence !== "number"
    ) {
      fail("`target.occurrence` must be 'error', 'first', or a zero-based index.", {
        path: `${path}.target.occurrence`,
        expected: ["error", "first", "number"],
        received: occurrence,
      });
    }
    if (typeof occurrence === "number" && (!Number.isInteger(occurrence) || occurrence < 0)) {
      fail("`target.occurrence` index must be a non-negative integer.", {
        path: `${path}.target.occurrence`,
        expected: "a non-negative integer",
        received: occurrence,
      });
    }
  }

  if (step.actions !== undefined) {
    if (!Array.isArray(step.actions)) {
      fail("Step `actions` must be an array.", {
        path: `${path}.actions`,
        expected: "array",
        received: describe(step.actions),
      });
    }
    step.actions.forEach((action, actionIndex) => {
      const actionPath = `${path}.actions[${actionIndex}]`;
      if (!isPlainObject(action)) {
        fail("Each action must be a plain object.", {
          path: actionPath,
          expected: "object",
          received: describe(action),
        });
      }
      checkString(action.label, `${actionPath}.label`, "Action `label`");
      if (action.onClick !== undefined) {
        checkFunction(action.onClick, `${actionPath}.onClick`, "Action `onClick`");
      }
      if (action.primary !== undefined) {
        checkBoolean(action.primary, `${actionPath}.primary`, "Action `primary`");
      }
    });
  }
}

/**
 * Validate a raw configuration object.
 *
 * Mutates nothing. Returns the input so it can be used inline.
 *
 * @param {unknown} config
 * @returns {Record<string, unknown>} the same object, validated
 */
export function validateConfig(config) {
  if (!isPlainObject(config)) {
    fail("createTour() requires a configuration object.", {
      path: "(root)",
      expected: "object",
      received: describe(config),
    });
  }

  checkString(config.tourId, "tourId", "`tourId`");

  if (!Array.isArray(config.steps)) {
    fail("`steps` must be an array.", {
      path: "steps",
      expected: "array",
      received: describe(config.steps),
    });
  }
  if (config.steps.length === 0) {
    fail("`steps` must contain at least one step.", {
      path: "steps",
      expected: "an array with at least 1 item",
      received: "an empty array",
    });
  }

  config.steps.forEach(validateStep);
  assertUniqueTargetIds(config.steps);

  if (config.startAt !== undefined) {
    if (typeof config.startAt === "number") {
      checkNumber(config.startAt, "startAt", "`startAt`", { min: 0 });
    } else {
      checkString(config.startAt, "startAt", "`startAt`");
    }
  }

  for (const key of [
    "loop",
    "showProgress",
    "showStepCounter",
    "showCloseButton",
    "closeOnEscape",
    "closeOnOverlayClick",
    "scrollIntoView",
    "keyboardNavigation",
    "allowTargetInteraction",
    "waitForTarget",
    "spotlight",
    "announce",
    "debug",
    "unsafeHTML",
  ]) {
    if (config[key] !== undefined) checkBoolean(config[key], key, `\`${key}\``);
  }

  if (config.theme !== undefined) checkEnum(config.theme, THEME_SET, "theme", "`theme`");
  if (config.animation !== undefined) {
    checkEnum(config.animation, ANIMATION_SET, "animation", "`animation`");
  }
  if (config.concurrency !== undefined) {
    checkEnum(config.concurrency, CONCURRENCY_SET, "concurrency", "`concurrency`");
  }
  if (config.placement !== undefined) {
    checkEnum(config.placement, PLACEMENT_SET, "placement", "`placement`");
  }
  if (config.tooltipWidth !== undefined) {
    checkNumber(config.tooltipWidth, "tooltipWidth", "`tooltipWidth`", { min: 120, max: 2000 });
  }
  if (config.zIndex !== undefined) {
    checkNumber(config.zIndex, "zIndex", "`zIndex`", { min: 0, max: 2147483647 });
  }

  if (config.offset !== undefined) {
    checkPlainObject(config.offset, "offset", "`offset`");
    checkNumber(config.offset.x, "offset.x", "`offset.x`");
    checkNumber(config.offset.y, "offset.y", "`offset.y`");
  }

  if (config.target !== undefined) {
    checkPlainObject(config.target, "target", "`target`");
    if (config.target.missing !== undefined) {
      checkEnum(config.target.missing, MISSING_SET, "target.missing", "`target.missing`");
    }
    if (config.target.timeout !== undefined) {
      checkNumber(config.target.timeout, "target.timeout", "`target.timeout`", {
        min: 0,
        max: 600000,
      });
    }
    if (config.target.occurrence !== undefined && !OCCURRENCES.has(config.target.occurrence)) {
      checkEnum(config.target.occurrence, OCCURRENCES, "target.occurrence", "`target.occurrence`");
    }
  }

  if (config.labels !== undefined) {
    checkPlainObject(config.labels, "labels", "`labels`");
    for (const [key, value] of Object.entries(config.labels)) {
      if (key !== "progress" && typeof value === "function") continue;
      checkString(value, `labels.${key}`, `\`labels.${key}\``);
    }
  }

  if (config.classes !== undefined) {
    checkPlainObject(config.classes, "classes", "`classes`");
    for (const [key, value] of Object.entries(config.classes)) {
      if (value === null || value === undefined || value === false) continue;
      checkString(value, `classes.${key}`, `\`classes.${key}\``);
    }
  }

  if (config.persistence !== undefined) {
    checkPlainObject(config.persistence, "persistence", "`persistence`");
    const { enabled, adapter, key, resume, resetOnComplete } = config.persistence;
    if (enabled !== undefined)
      checkBoolean(enabled, "persistence.enabled", "`persistence.enabled`");
    if (adapter !== undefined && adapter !== "memory" && adapter !== "localStorage") {
      if (typeof adapter !== "object" && typeof adapter !== "function") {
        fail(
          "`persistence.adapter` must be 'memory', 'localStorage', or a custom adapter object.",
          {
            path: "persistence.adapter",
            expected: ["memory", "localStorage", "adapter object"],
            received: describe(adapter),
          }
        );
      }
    }
    if (key !== undefined && key !== null) checkString(key, "persistence.key", "`persistence.key`");
    if (resume !== undefined) checkBoolean(resume, "persistence.resume", "`persistence.resume`");
    if (resetOnComplete !== undefined) {
      checkBoolean(resetOnComplete, "persistence.resetOnComplete", "`persistence.resetOnComplete`");
    }
  }

  if (config.on !== undefined) {
    checkPlainObject(config.on, "on", "`on`");
    for (const [name, handler] of Object.entries(config.on)) {
      if (!EVENT_NAMES.has(name)) {
        fail(`Unknown lifecycle event "${name}".`, {
          path: `on.${name}`,
          expected: [...EVENT_NAMES],
          received: name,
        });
      }
      if (handler === undefined || handler === null) continue;
      checkFunction(handler, `on.${name}`, `\`on.${name}\``);
    }
  }

  if (config.intro !== undefined && config.intro !== null) validateDialog(config.intro, "intro");
  if (config.completion !== undefined && config.completion !== null) {
    validateDialog(config.completion, "completion");
  }

  return config;
}

/**
 * Reject two steps that point at the same target identifier.
 *
 * Duplicate identifiers are almost always a copy-paste error, and silently
 * spotlighting the first of two identical `data-tour-id` values would hide the
 * mistake. An explicit `target.occurrence` on *every* sharing step is the
 * documented escape hatch.
 */
function assertUniqueTargetIds(steps) {
  /** @type {Map<string, number[]>} */
  const byId = new Map();

  steps.forEach((step, index) => {
    if (!step?.tourId) return;
    const list = byId.get(step.tourId) ?? [];
    list.push(index);
    byId.set(step.tourId, list);
  });

  for (const [targetId, indexes] of byId) {
    if (indexes.length < 2) continue;
    const everyStepOptedIn = indexes.every((index) => {
      const occurrence = steps[index]?.target?.occurrence;
      return occurrence === "first" || typeof occurrence === "number";
    });
    if (everyStepOptedIn) continue;

    fail(
      `Target identifier "${targetId}" is used by more than one step ` +
        `(steps[${indexes.join("], steps[")}]). Give each step a unique identifier, ` +
        "or set an explicit `target.occurrence` on every step that shares it.",
      {
        path: `steps[${indexes[1]}].tourId`,
        expected: "a unique target identifier",
        received: indexes.map((i) => `steps[${i}]`),
      }
    );
  }
}

function validateDialog(dialog, path) {
  checkPlainObject(dialog, path, `\`${path}\``);
  for (const key of ["title", "content"]) {
    if (dialog[key] === undefined || dialog[key] === null) continue;
    if (typeof dialog[key] !== "string" && typeof dialog[key] !== "function") {
      fail(`\`${path}.${key}\` must be a string or a function returning a string.`, {
        path: `${path}.${key}`,
        expected: "string | function",
        received: describe(dialog[key]),
      });
    }
  }
  if (dialog.actions !== undefined && !Array.isArray(dialog.actions)) {
    fail(`\`${path}.actions\` must be an array.`, {
      path: `${path}.actions`,
      expected: "array",
      received: describe(dialog.actions),
    });
  }
}

/** Exported for the engine's guard clauses. */
export function isKnownEvent(name) {
  return EVENT_NAMES.has(name);
}

export const __testing = { CALLBACK_KEYS };
