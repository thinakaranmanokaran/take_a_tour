/**
 * Public error types.
 *
 * Every error carries a machine-readable `code` and, where relevant, the
 * configuration path that caused it, so consumers can branch on failures
 * instead of parsing message strings.
 */

import { DATA_TOUR_ID } from "../constants.js";

class BaseError extends Error {
  /**
   * @param {string} message
   * @param {object} [details]
   */
  constructor(message, details = {}) {
    super(message);
    this.name = new.target.name;
    this.code = details.code ?? "TAT_ERROR";
    if (details.cause !== undefined) this.cause = details.cause;
    if (Error.captureStackTrace) Error.captureStackTrace(this, new.target);
  }
}

/** Raised for any problem originating in this library. */
export class TakeATourError extends BaseError {}

/** Invalid, missing or contradictory configuration. */
export class TourConfigError extends TakeATourError {
  /**
   * @param {string} message
   * @param {{ path?: string, expected?: unknown, received?: unknown }} [details]
   */
  constructor(message, details = {}) {
    super(message, { code: "TAT_CONFIG" });
    if (details.path) this.path = details.path;
    if (details.expected !== undefined) this.expected = details.expected;
    if (details.received !== undefined) this.received = details.received;
  }
}

/**
 * A target could not be resolved, or resolved ambiguously.
 *
 * `reason` is one of: `missing`, `ambiguous`, `invalid-selector`, `detached`,
 * `hidden`, `timeout`.
 */
export class TargetError extends TakeATourError {
  /**
   * @param {string} message
   * @param {{ targetId?: string, reason?: string, matches?: Element[], timeout?: number }} [details]
   */
  constructor(message, details = {}) {
    super(message, { code: "TAT_TARGET" });
    this.reason = details.reason ?? "missing";
    if (details.targetId !== undefined) this.targetId = details.targetId;
    if (details.matches !== undefined) this.matches = details.matches;
    if (details.timeout !== undefined) this.timeout = details.timeout;
  }
}

/** An illegal lifecycle transition was requested. */
export class TransitionError extends TakeATourError {
  /**
   * @param {string} message
   * @param {{ from?: string, to?: string, method?: string }} [details]
   */
  constructor(message, details = {}) {
    super(message, { code: "TAT_TRANSITION" });
    if (details.from) this.from = details.from;
    if (details.to) this.to = details.to;
    if (details.method) this.method = details.method;
  }
}

/** A persistence adapter failed or is unavailable. */
export class StorageError extends TakeATourError {
  /**
   * @param {string} message
   * @param {{ adapter?: string, cause?: unknown }} [details]
   */
  constructor(message, details = {}) {
    super(message, { code: "TAT_STORAGE", cause: details.cause });
    if (details.adapter) this.adapter = details.adapter;
  }
}

/** Human-readable description of an element, safe to include in messages. */
export function describeElement(element) {
  if (!element || typeof element !== "object") return String(element);
  const tag = String(element.tagName ?? "node").toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  const classes =
    typeof element.className === "string" && element.className.trim()
      ? `.${element.className.trim().split(/\s+/).join(".")}`
      : "";
  const tourId = element.getAttribute?.(DATA_TOUR_ID);
  const tour = tourId ? `[${DATA_TOUR_ID}="${tourId}"]` : "";
  return `<${tag}${id}${classes}${tour}>`;
}
