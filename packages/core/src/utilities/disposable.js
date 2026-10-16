/**
 * Disposable resource stack.
 *
 * Every listener, observer, timer and animation frame a tour creates is
 * registered here, so `dispose()` provably releases everything. This is the
 * mechanism behind the "destroy leaves nothing behind" guarantee, and it is
 * what the cleanup tests assert against.
 */

export function createDisposalStack() {
  /** @type {Array<() => void>} */
  const cleanups = [];
  let disposed = false;

  function push(cleanup) {
    if (typeof cleanup !== "function") return () => {};
    if (disposed) {
      // Registering after disposal must not leak: run immediately.
      try {
        cleanup();
      } catch {
        /* disposal is best-effort and never throws */
      }
      return () => {};
    }
    cleanups.push(cleanup);
    return () => {
      const index = cleanups.indexOf(cleanup);
      if (index !== -1) cleanups.splice(index, 1);
    };
  }

  return {
    /** Register an arbitrary cleanup callback. */
    add(cleanup) {
      return push(cleanup);
    },

    /** Register a DOM event listener and its removal. */
    addListener(target, type, handler, options) {
      if (!target || typeof target.addEventListener !== "function") return () => {};
      target.addEventListener(type, handler, options);
      return push(() => target.removeEventListener(type, handler, options));
    },

    /** Register a media-query / match-media change listener. */
    addMediaQuery(mql, handler) {
      if (!mql || typeof mql.addEventListener !== "function") return () => {};
      mql.addEventListener("change", handler);
      return push(() => mql.removeEventListener("change", handler));
    },

    /** Register an observer (ResizeObserver, MutationObserver, IntersectionObserver). */
    addObserver(observer) {
      if (!observer || typeof observer.disconnect !== "function") return () => {};
      return push(() => observer.disconnect());
    },

    /** Register a timer id, clearing it on dispose. */
    addTimeout(id) {
      if (id === undefined || id === null) return () => {};
      return push(() => clearTimeout(id));
    },

    /** Register an interval id. */
    addInterval(id) {
      if (id === undefined || id === null) return () => {};
      return push(() => clearInterval(id));
    },

    /** Register a requestAnimationFrame handle. */
    addFrame(id) {
      if (id === undefined || id === null) return () => {};
      return push(() => cancelAnimationFrame(id));
    },

    /** Register DOM nodes for removal on dispose. */
    addNode(node) {
      if (!node) return () => {};
      return push(() => {
        node.remove?.();
      });
    },

    /** Run every registered cleanup, newest first. Never throws. */
    dispose() {
      if (disposed) return;
      disposed = true;
      while (cleanups.length) {
        const cleanup = cleanups.pop();
        try {
          cleanup();
        } catch {
          // A failing cleanup must not strand the remaining ones.
        }
      }
    },

    /** Number of resources still registered. Used by leak assertions in tests. */
    get size() {
      return cleanups.length;
    },

    get disposed() {
      return disposed;
    },
  };
}
