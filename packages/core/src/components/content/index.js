/**
 * Step content rendering.
 *
 * The security boundary of this library lives in this file.
 *
 * Default path: every value is inserted with `textContent`. Nothing in this
 * module parses configuration data as markup unless the tour has explicitly
 * opted in via `unsafeHTML: true`, and that path is delegated to
 * `unsafe-html.js` so it stays auditable on its own.
 */

import { createElement } from "../../utilities/dom.js";
import { isTrustedMarkupEnabled, setTrustedMarkup } from "./unsafe-html.js";

/**
 * Produce the display text for a step field.
 *
 * @param {string|Function|undefined} value
 * @param {object} [context] passed to function-valued fields
 * @returns {string}
 */
export function resolveText(value, context) {
  if (value === undefined || value === null) return "";
  if (typeof value === "function") {
    const result = value(context);
    // A callback may legitimately be async. Rendering the raw promise would
    // display "[object Promise]", so only synchronous strings are accepted.
    return typeof result === "string" ? result : "";
  }
  return String(value);
}

/**
 * Render a content block into a container.
 *
 * @param {HTMLElement} container
 * @param {object} params
 * @param {string|Function} [params.content]
 * @param {object} params.context
 * @param {object} [params.config] tour configuration, for the HTML opt-in
 * @param {string} [params.unsafeContent] trusted markup, only read when opted in
 */
export function renderContent(container, { content, context, config, unsafeContent }) {
  container.textContent = "";
  const text = resolveText(content, context);

  if (!text) return container;

  if (isTrustedMarkupEnabled(config) && typeof unsafeContent === "string" && unsafeContent.trim()) {
    setTrustedMarkup(container, unsafeContent);
    return container;
  }

  container.textContent = text;
  return container;
}

/**
 * Build the standard title + content block used by the tooltip and the modal.
 *
 * @param {object} params
 * @param {string|Function} [params.title]
 * @param {string|Function} [params.content]
 * @param {object} params.context
 * @param {object} [params.config]
 * @param {string} [params.unsafeContent]
 */
export function createBody({ title, content, context, config, unsafeContent }) {
  const body = createElement("div", { className: "tat-tooltip__body" });

  if (title !== undefined && title !== null) {
    const heading = createElement("h2", { className: "tat-tooltip__title", id: "tat-title" });
    heading.textContent = resolveText(title, context);
    if (heading.textContent) body.append(heading);
  }

  if (content !== undefined && content !== null) {
    const text = createElement("div", { className: "tat-tooltip__content" });
    renderContent(text, { content, context, config, unsafeContent });
    if (text.childNodes.length) body.append(text);
  }

  return body;
}
