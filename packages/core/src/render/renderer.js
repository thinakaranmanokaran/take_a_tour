/**
 * Renderer contract.
 *
 * The engine never imports a component. It talks to this narrow interface, so
 * the UI can be replaced or disabled without touching business logic — and so
 * the engine can be unit-tested with no DOM involvement at all.
 *
 *   mount()          create the UI root
 *   present(ctx)     display a step (create or update)
 *   refresh(ctx)     re-display the current step after a config change
 *   unmount()        release the UI
 *
 * `ctx` shape:
 *   {
 *     step,        normalized step configuration
 *     config,      normalized tour configuration
 *     entry,       { step, index } — index is into config.steps
 *     position,    index into the active step list
 *     total,       number of active steps
 *     target,      Element | null
 *     spotlight,   boolean — whether to draw a spotlight
 *     navigation,  { canGoPrevious, canGoNext, isFirst, isLast }
 *   }
 */

import { createDisposalStack } from "../utilities/disposable.js";

/**
 * A renderer that draws nothing.
 *
 * Used by the default engine tests and by `debug: true` headless runs, and it
 * keeps the engine importable in a non-DOM environment.
 */
export function createNullRenderer() {
  return {
    mount() {},
    present() {},
    refresh() {},
    setTheme() {},
    unmount() {},
  };
}

/**
 * Assert that a renderer satisfies the contract.
 * @param {object} renderer
 */
export function assertRenderer(renderer) {
  const required = ["mount", "present", "refresh", "unmount"];
  for (const method of required) {
    if (typeof renderer[method] !== "function") {
      throw new TypeError(`A renderer must implement ${method}().`);
    }
  }
  return renderer;
}

/**
 * Wrap a renderer so every resource it registers is released on unmount.
 * This is what guarantees a destroyed tour leaves nothing behind.
 */
export function createManagedRenderer(inner, { onError } = {}) {
  let stack = null;
  let mounted = false;

  return {
    get mounted() {
      return mounted;
    },
    get size() {
      return stack?.size ?? 0;
    },

    mount(payload, options) {
      if (mounted) return;
      stack = createDisposalStack();
      mounted = true;
      try {
        inner.mount(payload, { ...options, stack });
      } catch (error) {
        stack.dispose();
        mounted = false;
        stack = null;
        throw error;
      }
    },

    present(context, options) {
      if (!mounted) return;
      try {
        inner.present(context, { ...options, stack });
      } catch (error) {
        onError?.(error);
      }
    },

    refresh(context, options) {
      if (!mounted) return;
      try {
        inner.refresh(context, { ...options, stack });
      } catch (error) {
        onError?.(error);
      }
    },

    setTheme(theme, options) {
      if (!mounted) return;
      try {
        inner.setTheme?.(theme, { ...options, stack });
      } catch (error) {
        onError?.(error);
      }
    },

    setPaused(paused, options) {
      if (!mounted) return;
      try {
        inner.setPaused?.(paused, { ...options, stack });
      } catch (error) {
        onError?.(error);
      }
    },

    unmount() {
      if (!mounted) return;
      mounted = false;
      stack?.dispose();
      stack = null;
      inner.unmount?.();
    },

    // --- pass-throughs for the UI renderer's private surface ---------------
    // The engine and the test suites need to reach the DOM layer; the managed
    // wrapper is what they hold, so these delegate rather than duplicating.
    __bindControlHandlers(value) {
      inner.__bindControlHandlers?.(value);
    },
    __surface() {
      return inner.__surface?.();
    },
    __root() {
      return inner.__root?.();
    },
    __focusables() {
      return inner.__focusables?.() ?? [];
    },
    __trapped() {
      return inner.__trapped?.() ?? false;
    },
    __disposalSize() {
      return stack?.size ?? 0;
    },
  };
}
