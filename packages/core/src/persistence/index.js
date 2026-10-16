/**
 * Persistence.
 *
 * Disabled by default. When enabled, the library stores only a tour id, a
 * completion flag, and a step index — never personal data, form values, or
 * tokens. Storage access is wrapped because `localStorage` throws rather than
 * returning null in private browsing modes, when cookies are blocked, and in
 * some embedded webviews. Any failure degrades to in-memory state instead of
 * breaking the tour.
 */

import { StorageError } from "../errors/index.js";

/** In-memory adapter. The default: works everywhere, forgets on reload. */
export function createMemoryAdapter() {
  const store = new Map();
  return {
    name: "memory",
    get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    set(key, value) {
      store.set(key, value);
    },
    remove(key) {
      store.delete(key);
    },
  };
}

/**
 * `localStorage` adapter, hardened against unavailable or blocked storage.
 *
 * The availability check itself must be inside try/catch: merely *touching*
 * `window.localStorage` throws in some configurations.
 */
export function createLocalStorageAdapter(storage) {
  const name = "localStorage";
  let backing = null;

  try {
    const candidate =
      storage ?? (typeof globalThis !== "undefined" ? globalThis.localStorage : null);
    if (candidate) {
      const probe = "__tat_probe__";
      candidate.setItem(probe, "1");
      candidate.removeItem(probe);
      backing = candidate;
    }
  } catch {
    backing = null;
  }

  if (!backing) {
    // Fall back to memory so the feature degrades rather than throws.
    const fallback = createMemoryAdapter();
    return { ...fallback, name: `${name}(unavailable)` };
  }

  return {
    name,
    get(key) {
      try {
        const raw = backing.getItem(key);
        return raw === null ? null : JSON.parse(raw);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        backing.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        // Quota exceeded or storage disabled mid-session.
        return false;
      }
    },
    remove(key) {
      try {
        backing.removeItem(key);
      } catch {
        /* nothing useful to do */
      }
    },
  };
}

/**
 * Validate a user-supplied adapter.
 * @param {object} adapter
 */
function assertAdapter(adapter) {
  for (const method of ["get", "set", "remove"]) {
    if (typeof adapter[method] !== "function") {
      throw new StorageError(`A custom persistence adapter must implement ${method}().`, {
        adapter: adapter.name ?? "custom",
      });
    }
  }
  return adapter;
}

/**
 * Resolve the configured adapter into a uniform interface.
 *
 * @param {object} params
 * @param {object} params.settings normalized `persistence` options
 * @param {string} params.tourId
 * @param {object} [params.logger]
 */
export function createPersistenceAdapter({ settings, tourId, logger }) {
  if (!settings?.enabled) {
    return {
      load: () => null,
      save: () => {},
      clear: () => {},
      dispose: () => {},
      get adapterName() {
        return "none";
      },
    };
  }

  const { adapter, key, resetOnComplete } = settings;
  let backend;

  try {
    if (adapter === "localStorage") backend = createLocalStorageAdapter();
    else if (adapter === "memory" || adapter === undefined) backend = createMemoryAdapter();
    else backend = assertAdapter(adapter);
  } catch (error) {
    logger?.warn("Falling back to in-memory persistence:", error);
    backend = createMemoryAdapter();
  }

  const storageKey = key ?? `take-a-tour:${tourId}`;

  return {
    get adapterName() {
      return backend.name;
    },

    load() {
      if (resetOnComplete) return null;
      const value = backend.get(storageKey);
      if (!value || typeof value !== "object") return null;
      return {
        stepIndex: Number.isInteger(value.stepIndex) ? value.stepIndex : 0,
        completed: Boolean(value.completed),
      };
    },

    save({ stepIndex = 0, completed = false } = {}) {
      try {
        backend.set(storageKey, { stepIndex, completed, tourId });
      } catch (error) {
        logger?.warn("Could not persist tour progress:", error);
      }
    },

    clear() {
      backend.remove(storageKey);
    },

    dispose() {},
  };
}
