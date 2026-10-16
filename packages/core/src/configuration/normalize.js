/**
 * Configuration normalization.
 *
 * Responsibilities:
 *   - Merge the precedence chain: built-in defaults → global defaults → tour
 *     config. Step-level overrides are applied at read time, not copied here.
 *   - Deep-clone so the caller's object is never mutated or aliased.
 *   - Deep-freeze plain structures so engine code cannot corrupt shared state.
 *
 * Functions and DOM elements are carried by reference and never frozen:
 * `Object.freeze` on a live element would break the host page.
 */

import { DEFAULT_CONFIG } from "./defaults.js";
import { isPlainObject } from "../utilities/dom.js";
import { validateConfig } from "./validate.js";

/**
 * Deep clone JSON-shaped data while preserving functions, DOM nodes and class
 * instances by reference.
 *
 * @template T
 * @param {T} value
 * @param {WeakMap} [seen] guards against circular configuration
 * @returns {T}
 */
export function cloneConfig(value, seen = new WeakMap()) {
  if (Array.isArray(value)) {
    if (seen.has(value)) return seen.get(value);
    const copy = [];
    seen.set(value, copy);
    for (const item of value) copy.push(cloneConfig(item, seen));
    return copy;
  }

  if (isPlainObject(value)) {
    if (seen.has(value)) return seen.get(value);
    const copy = {};
    seen.set(value, copy);
    for (const [key, item] of Object.entries(value)) {
      copy[key] = cloneConfig(item, seen);
    }
    return copy;
  }

  return value;
}

/**
 * Deep-freeze plain objects and arrays only.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function deepFreezePlain(value) {
  if (Array.isArray(value)) {
    for (const item of value) deepFreezePlain(item);
    return Object.freeze(value);
  }
  if (isPlainObject(value)) {
    for (const item of Object.values(value)) deepFreezePlain(item);
    return Object.freeze(value);
  }
  return value;
}

/**
 * Merge override sources onto a base object, recursing into plain objects only.
 * Later sources win. Arrays are replaced, never concatenated.
 */
export function mergeConfig(base, ...sources) {
  const result = { ...base };
  for (const source of sources) {
    if (!isPlainObject(source)) continue;
    for (const [key, value] of Object.entries(source)) {
      if (value === undefined) continue;
      if (isPlainObject(value) && isPlainObject(result[key])) {
        result[key] = mergeConfig(result[key], value);
      } else {
        result[key] = cloneConfig(value);
      }
    }
  }
  return result;
}

/**
 * Produce the immutable, fully-merged configuration for a tour.
 *
 * @param {object} rawConfig caller-supplied configuration
 * @param {object} [globalDefaults] from `configureTour({ defaults })`
 * @returns {Readonly<object>}
 */
export function normalizeConfig(rawConfig, globalDefaults = {}) {
  validateConfig(rawConfig);

  // Step 1: clone the caller's input. Everything after this point works on our
  // own copy, so the caller can safely reuse or mutate their object.
  const cloned = cloneConfig(rawConfig);

  // Step 2: apply the precedence chain. `labels` and `classes` merge key by
  // key; other nested objects (target, persistence, offset) do too.
  const merged = mergeConfig(
    mergeConfig(cloneConfig(DEFAULT_CONFIG), cloneConfig(globalDefaults)),
    cloned
  );

  // Step 3: derive values that depend on more than one input.
  if (!merged.persistence.key) {
    merged.persistence.key = `take-a-tour:${merged.tourId}`;
  }

  deepFreezePlain(merged);
  return merged;
}

/**
 * Read an option for a step, falling back to the tour-level value.
 *
 * Precedence: step → tour → built-in default (already merged into the tour).
 *
 * @param {Readonly<object>} config
 * @param {Readonly<object>|null|undefined} step
 * @param {string} key
 */
export function resolveOption(config, step, key) {
  if (step && step[key] !== undefined) return step[key];
  return config[key];
}

/** True when the step points at a host element rather than being a centred dialog. */
export function isAnchored(step) {
  if (!step) return false;
  if (step.tourId) return true;
  return Boolean(step.target && (step.target.selector || step.target.element));
}
