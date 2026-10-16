/**
 * Root element management.
 *
 * Each tour instance owns exactly one root element. A single shared root was
 * considered, but per-tour ownership makes isolation and teardown provable:
 * destroying a tour removes its whole subtree and cannot disturb another's.
 *
 * With the default concurrency policy only one tour is ever on screen, so this
 * produces a single overlay in practice.
 */

import { CLS } from "../constants.js";
import { createElement } from "../utilities/dom.js";

/**
 * @param {object} options
 * @param {object} options.config normalized configuration
 * @param {string} options.tourId
 * @returns {{ element: HTMLElement, setTheme(theme: string): void, destroy(): void }}
 */
export function createRootManager({ config, tourId }) {
  const root = createElement("div", {
    className: [CLS.root, config.classes.root].filter(Boolean).join(" "),
    attributes: {
      "data-tat-tour": tourId,
      "data-tat-state": "idle",
      role: "presentation",
    },
  });

  root.style.setProperty("--tat-z", String(config.zIndex));

  let appended = false;

  function mount() {
    if (appended) return root;
    const parent = document.body ?? document.documentElement;
    parent.append(root);
    appended = true;
    return root;
  }

  function setTheme(theme) {
    const resolved = theme === "system" ? "light" : theme;
    root.setAttribute("data-tat-theme", resolved);
    // A concrete theme is also published as a class so consumers can target it.
    root.classList.toggle(CLS.themeLight, resolved === "light");
    root.classList.toggle(CLS.themeDark, resolved === "dark");
  }

  function setState(state) {
    root.setAttribute("data-tat-state", state);
  }

  function destroy() {
    root.remove();
    appended = false;
  }

  return {
    element: root,
    mount,
    setTheme,
    setState,
    destroy,
    get appended() {
      return appended;
    },
  };
}
