/**
 * Safe DOM construction helpers.
 *
 * All library UI is built with `createElement` and `textContent`. There is no
 * code path in this file that inserts markup from configuration.
 */

/**
 * Create an element.
 *
 * @param {string} tag
 * @param {object} [options]
 * @param {string} [options.className]
 * @param {string} [options.text] plain text, inserted with textContent
 * @param {Record<string, string|number|boolean|null|undefined>} [options.attributes]
 * @param {Record<string, string>} [options.dataset]
 * @param {Record<string, Function>} [options.on]
 * @param {Element[]} [options.children]
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  const { className, text, attributes, dataset, on, children } = options;

  if (className) element.className = className;
  if (text !== undefined && text !== null) element.textContent = String(text);
  if (attributes) {
    for (const [name, value] of Object.entries(attributes)) {
      if (value === null || value === undefined || value === false) continue;
      element.setAttribute(name, value === true ? "" : String(value));
    }
  }
  if (dataset) {
    for (const [name, value] of Object.entries(dataset)) {
      if (value === undefined || value === null) continue;
      element.dataset[name] = String(value);
    }
  }
  if (on) {
    for (const [type, handler] of Object.entries(on)) {
      element.addEventListener(type, handler);
    }
  }
  if (children) {
    for (const child of children) {
      if (child) element.append(child);
    }
  }
  return element;
}

/**
 * Create an SVG element in the correct namespace.
 *
 * `createElement` cannot build SVG correctly; icons use this instead of
 * `innerHTML`.
 */
export function createSvgElement(tag, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === null || value === undefined || value === false) continue;
    element.setAttribute(name, String(value));
  }
  return element;
}

/** Replace an element's text, always through `textContent`. */
export function setText(element, text) {
  if (!element) return element;
  element.textContent = text === undefined || text === null ? "" : String(text);
  return element;
}

/** Replace an element's children with `nodes`. */
export function replaceChildren(element, nodes) {
  if (!element) return element;
  element.replaceChildren(...nodes.filter(Boolean));
  return element;
}

export function toggleClass(element, className, force) {
  if (!element) return element;
  element.classList.toggle(className, force);
  return element;
}

/**
 * Whether an element is visually available for a tour to point at.
 *
 * Walks the ancestor chain because `display: none` on an ancestor is not
 * reflected in a descendant's own computed `display`. Deliberately avoids
 * `getClientRects()`, which is always empty in jsdom and would make unit tests
 * report every target as hidden.
 */
export function isElementHidden(element) {
  if (!element || element.nodeType !== 1) return true;
  if (element.hasAttribute?.("hidden")) return true;
  if (element.getAttribute?.("aria-hidden") === "true") return true;

  let node = element;
  while (node && node.nodeType === 1) {
    const style = typeof getComputedStyle === "function" ? getComputedStyle(node) : null;
    if (style) {
      if (style.display === "none") return true;
      if (style.visibility === "hidden" || style.visibility === "collapse") return true;
    }
    if (node.getAttribute?.("hidden") !== null && node.hasAttribute?.("hidden")) return true;
    node = node.parentElement;
  }
  return false;
}

/** Coalesce repeated work into a single animation frame. */
export function nextFrame(callback) {
  if (typeof requestAnimationFrame === "function") return requestAnimationFrame(callback);
  return setTimeout(() => callback(Date.now()), 16);
}

export function cancelFrame(id) {
  if (id === undefined || id === null) return;
  if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(id);
  else clearTimeout(id);
}

/** Format a `{placeholder}` template such as `"Step {current} of {total}"`. */
export function formatTemplate(template, values) {
  if (typeof template !== "string") return "";
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    Object.hasOwn(values ?? {}, key) ? String(values[key]) : match
  );
}

/** Deep-equal for the small, JSON-shaped values the engine compares. */
export function isPlainObject(value) {
  if (value === null || typeof value !== "object") return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
