/**
 * Trusted HTML — the single sanctioned markup path in the package.
 *
 * Kept in its own file so the runtime dependency audit can allowlist exactly
 * one module, and so a reviewer can read the entire trusted-markup surface in
 * one place.
 *
 * Read SECURITY.md before using it. When a tour enables `unsafeHTML: true`, the
 * markup it supplies is parsed exactly as `innerHTML` would parse it: it may
 * load remote resources and, in some document contexts, execute script. Only
 * enable it for markup you authored yourself — never for user input, API
 * responses, or anything else you did not write.
 */

/**
 * Replace an element's contents with developer-authored markup.
 *
 * @param {HTMLElement} container
 * @param {string} markup
 * @returns {HTMLElement}
 */
export function setTrustedMarkup(container, markup) {
  container.innerHTML = markup;
  return container;
}

/** Whether a tour has opted in to trusted markup. */
export function isTrustedMarkupEnabled(config) {
  return Boolean(config?.unsafeHTML);
}
