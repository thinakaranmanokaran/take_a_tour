/**
 * Debug logging.
 *
 * Silent unless a tour opts in with `debug: true`, and never logs application
 * content — only the library's own state.
 */

let globalDebug = false;

export function setGlobalDebug(value) {
  globalDebug = Boolean(value);
}

export function createLogger({ debug = false, namespace = "take-a-tour" } = {}) {
  const enabled = () => Boolean(debug ?? globalDebug);

  return {
    get enabled() {
      return enabled();
    },
    log(...args) {
      if (enabled()) console.log(`[${namespace}]`, ...args);
    },
    warn(...args) {
      if (enabled()) console.warn(`[${namespace}]`, ...args);
    },
    error(...args) {
      console.error(`[${namespace}]`, ...args);
    },
  };
}
