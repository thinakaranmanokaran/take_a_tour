import { useEffect, useState } from "react";
import { useTour } from "../hooks/useTour.js";
import { describeEvent } from "../lib/tour-status.js";

/**
 * Live theme customiser.
 *
 * The controls write ordinary CSS custom properties onto `:root`. The site
 * stylesheet maps them onto the library's `--tat-*` tokens at the tour root
 * (the library pins those tokens per theme, so overrides need a dedicated
 * hook — see the `--tat-site-*` block in `global.css`). A running tour
 * restyles immediately and nothing is recompiled. The properties are removed
 * again on unmount, so the page never leaks its experiment into the rest of
 * the site.
 */

const DEFAULTS = { primary: "#c01f00", width: 320, radius: 14 };

/** WCAG 2.x relative luminance of a `#rrggbb` colour, 0 (black) to 1 (white). */
function luminance(hex) {
  const channel = (value) => {
    const c = parseInt(value, 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return (
    0.2126 * channel(hex.slice(1, 3)) +
    0.7152 * channel(hex.slice(3, 5)) +
    0.0722 * channel(hex.slice(5, 7))
  );
}

/** Ink or white — whichever reads better on the chosen accent. */
function contrastFor(hex) {
  return luminance(hex) > 0.2 ? "#1b1a18" : "#ffffff";
}

const STEPS = [
  {
    tourId: "customiser.primary",
    title: "Your accent colour",
    content: "The Next button, focus ring and progress fill all use --tat-color-primary.",
    placement: "right",
  },
  {
    tourId: "customiser.width",
    title: "Your width",
    content: "The tooltip measures itself after mount, so placement stays correct at any width.",
    placement: "bottom",
  },
  {
    tourId: "customiser.radius",
    title: "Your radius",
    content: "Tooltip and modal share --tat-radius-lg.",
    placement: "left",
  },
];

export default function ThemeCustomiser() {
  const tour = useTour();
  const [primary, setPrimary] = useState(DEFAULTS.primary);
  const [width, setWidth] = useState(DEFAULTS.width);
  const [radius, setRadius] = useState(DEFAULTS.radius);
  const [status, setStatus] = useState("Idle. Adjust the tokens, then start a tour.");

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--tat-site-primary", primary);
    root.setProperty("--tat-site-contrast", contrastFor(primary));
    root.setProperty("--tat-tooltip-width", `${width}px`);
    root.setProperty("--tat-radius-lg", `${radius}px`);
  }, [primary, width, radius]);

  useEffect(() => {
    return () => {
      const root = document.documentElement.style;
      root.removeProperty("--tat-site-primary");
      root.removeProperty("--tat-site-contrast");
      root.removeProperty("--tat-tooltip-width");
      root.removeProperty("--tat-radius-lg");
    };
  }, []);

  const run = () =>
    tour.start(
      { tourId: "theme-customiser", theme: "system", steps: STEPS },
      { onEvent: (name, payload) => setStatus(describeEvent(name, payload)) }
    );

  const reset = () => {
    setPrimary(DEFAULTS.primary);
    setWidth(DEFAULTS.width);
    setRadius(DEFAULTS.radius);
    setStatus("Tokens reset to the site defaults.");
  };

  return (
    <div className="customiser" id="theme-customiser">
      <label className="customiser__field" data-tour-id="customiser.primary">
        <span>
          Accent <output id="primary-value">{primary}</output>
        </span>
        <input
          type="color"
          id="primary"
          value={primary}
          onChange={(event) => setPrimary(event.target.value)}
        />
      </label>

      <label className="customiser__field" data-tour-id="customiser.width">
        <span>
          Tooltip width <output id="width-value">{width}px</output>
        </span>
        <input
          type="range"
          id="width"
          min={220}
          max={460}
          value={width}
          onChange={(event) => setWidth(Number(event.target.value))}
        />
      </label>

      <label className="customiser__field" data-tour-id="customiser.radius">
        <span>
          Corner radius <output id="radius-value">{radius}px</output>
        </span>
        <input
          type="range"
          id="radius"
          min={0}
          max={24}
          value={radius}
          onChange={(event) => setRadius(Number(event.target.value))}
        />
      </label>

      <div className="customiser__actions">
        <button
          type="button"
          className="button button--primary"
          id="customiser-start"
          onClick={run}
        >
          {tour.active ? "Restart the tour" : "Start a tour"}
        </button>
        <button type="button" className="button" id="customiser-reset" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="demo-status" role="status" data-variant={tour.error ? "error" : undefined}>
        {tour.error ? tour.error.message : status}
      </p>
    </div>
  );
}
