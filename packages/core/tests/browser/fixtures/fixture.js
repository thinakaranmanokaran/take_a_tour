/**
 * Fixture page wiring.
 *
 * Imports the library's real source modules directly through the static
 * server — no bundler, no import-map rewriting beyond what the server maps.
 * The CSS is likewise the real `styles/index.css`.
 */

import { createTour, STATES, TargetError } from "/lib/src/index.js";

window.TakeATour = { createTour, STATES, TargetError };
window.__listeners = { added: 0, removed: 0 };

// Count document-level listeners so cleanup can be proven, not assumed.
const realAdd = document.addEventListener.bind(document);
const realRemove = document.removeEventListener.bind(document);
document.addEventListener = (type, ...rest) => {
  window.__listeners.added += 1;
  return realAdd(type, ...rest);
};
document.removeEventListener = (type, ...rest) => {
  window.__listeners.removed += 1;
  return realRemove(type, ...rest);
};

let counter = 0;

/**
 * Create a tour for the current test.
 *
 * Each call gets a unique `tourId` and disposes of the previous one, so a test
 * that creates two tours in a row does not trip the registry's duplicate-id
 * guard. Pass `keepExisting: true` when a test genuinely needs two live tours
 * at once — such as the concurrency tests.
 */
window.createTestTour = (config, { keepExisting = false } = {}) => {
  if (!keepExisting) window.tour?.destroy?.();
  counter += 1;
  const tour = createTour({ tourId: `browser-test-${counter}`, ...config });
  window.tour = tour;
  return tour;
};

window.tourReady = true;
