/**
 * Tour registry.
 *
 * Tracks live tour instances by tour id so that:
 *   - two tours cannot silently share an id;
 *   - a tour can be looked up for control (`getTour('home-onboarding')`);
 *   - `destroyAllTours()` can guarantee the page is left clean.
 *
 * Registering a duplicate id is an error by default. Overwriting silently would
 * leave the first instance's overlay in the DOM with no handle to remove it.
 */

import { TourConfigError } from "../errors/index.js";

const instances = new Map();

/**
 * @param {object} instance the public tour instance
 * @param {{ replace?: boolean }} [options]
 */
export function registerTour(instance, options = {}) {
  const { tourId } = instance;
  const existing = instances.get(tourId);

  if (existing && existing !== instance && !options.replace) {
    throw new TourConfigError(
      `A tour with tourId "${tourId}" is already registered. ` +
        "Give this tour a unique `tourId`, or pass `{ replace: true }` to take over the existing one.",
      { path: "tourId", expected: "a tourId that is not already registered", received: tourId }
    );
  }

  if (existing && existing !== instance) {
    existing.destroy();
  }

  instances.set(tourId, instance);
  return instance;
}

export function unregisterTour(instance) {
  const { tourId } = instance;
  if (instances.get(tourId) === instance) instances.delete(tourId);
}

export function getTour(tourId) {
  return instances.get(tourId);
}

export function hasTour(tourId) {
  return instances.has(tourId);
}

/** @returns {Array<object>} every registered instance, in registration order. */
export function listTours() {
  return [...instances.values()];
}

export function destroyAllTours() {
  for (const instance of [...instances.values()]) {
    try {
      instance.destroy();
    } catch {
      // One misbehaving tour must not block cleanup of the rest.
    }
  }
  instances.clear();
}

/** Test seam: clears the registry without calling destroy. */
export function __resetRegistry() {
  instances.clear();
}
