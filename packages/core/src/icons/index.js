/**
 * Icon system.
 *
 * Icons are local SVG path data, not a runtime icon dependency, and never
 * fetched from a CDN. Each is built with `createElementNS` — no `innerHTML`.
 *
 * Path data below is taken from Lucide (https://lucide.dev), which is licensed
 * under the ISC License. See ATTRIBUTION.md in this directory.
 */

import { createSvgElement } from "../utilities/dom.js";

const VIEWBOX = "0 0 24 24";

/** Lucide stroke icon: 24×24 viewBox, 2px stroke, round caps and joins. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  "stroke-width": "2",
  "stroke-linecap": "round",
  "stroke-linejoin": "round",
};

export const ICON_PATHS = {
  "chevron-left": ["m15 18-6-6 6-6"],
  "chevron-right": ["m9 18 6-6-6-6"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  check: ["M20 6 9 17l-5-5"],
  "check-circle": ["M21.801 10A10 10 0 1 1 17 3.335", "m9 11 3 3L22 4"],
  sparkle: [
    "M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z",
  ],
};

/**
 * Build an SVG element for a named icon.
 *
 * The icon is always `aria-hidden`: the accessible name belongs to the control
 * that contains it, never to the shape.
 *
 * @param {keyof typeof ICON_PATHS} name
 * @param {{ size?: number, className?: string }} [options]
 * @returns {SVGElement}
 */
export function createIcon(name, options = {}) {
  const paths = ICON_PATHS[name];
  if (!paths) {
    throw new Error(
      `Unknown icon "${name}". Available icons: ${Object.keys(ICON_PATHS).join(", ")}.`
    );
  }

  const svg = createSvgElement("svg", {
    viewBox: VIEWBOX,
    ...STROKE,
    "aria-hidden": "true",
    focusable: "false",
    class: options.className,
    width: options.size ?? 16,
    height: options.size ?? 16,
  });

  for (const definition of paths) {
    svg.append(createSvgElement("path", { d: definition }));
  }

  return svg;
}

/** Every icon name the library ships. */
export const AVAILABLE_ICONS = Object.keys(ICON_PATHS);
