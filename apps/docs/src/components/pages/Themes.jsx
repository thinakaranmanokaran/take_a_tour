import Callout from "../Callout.jsx";
import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";

/**
 * `/docs/themes` — tokens, themes and the live customiser island passed in
 * from the route shell.
 */
export default function Themes({ customiser }) {
  return (
    <>
      <h1>Themes and styling</h1>
      <p className="lede">
        Every visual decision is a CSS custom property. Change any of them and nothing needs to be
        recompiled.
      </p>

      <h2>Choosing a theme</h2>

      <CodeBlock
        lang="js"
        code={`createTour({ tourId: "x", theme: "dark", steps: [/* … */] });   // always dark
createTour({ tourId: "x", theme: "light", steps: [/* … */] });  // always light
createTour({ tourId: "x", theme: "system", steps: [/* … */] }); // follow the OS

tour.setTheme("dark");        // at runtime
tour.update({ theme: "light" }); // equivalent`}
      />

      <h3>Global defaults</h3>

      <CodeBlock
        lang="js"
        code={`import { configureTour } from "@take-a-tour/core";

configureTour({
  defaults: {
    theme: "dark",
    animation: "instant",
    showProgress: false,
  },
});`}
      />

      <Callout title="system follows the OS, live">
        <p>
          In <code>system</code> mode the tour responds to <code>prefers-color-scheme</code>,
          including changes made while the tour is open. A user who switches their system theme
          mid-tour sees the tour follow.
        </p>
      </Callout>

      <h2>Overriding tokens</h2>

      <p>Scoped to your whole application:</p>

      <CodeBlock
        lang="css"
        code={`:root {
  --tat-color-primary: #0ea5e9;
  --tat-tooltip-width: 380px;
  --tat-radius-lg: 6px;
}`}
      />

      <p>Or scoped to just one tour's root element:</p>

      <CodeBlock
        lang="css"
        code={`.tat-root[data-tat-tour="marketing-onboarding"] {
  --tat-color-primary: #db2777;
  --tat-tooltip-width: 300px;
}`}
      />

      <h2>Tokens</h2>

      <h3>Colour</h3>

      <Table
        head={["Token", "Purpose"]}
        rows={[
          ["<code>--tat-color-primary</code>", "Accent: Next button, progress fill, focus ring"],
          ["<code>--tat-color-primary-hover</code>", "Hover state of the accent"],
          ["<code>--tat-color-primary-contrast</code>", "Text on the accent"],
          ["<code>--tat-color-primary-soft</code>", "Tinted background, e.g. modal badge"],
          ["<code>--tat-color-surface</code>", "Tooltip and modal background"],
          ["<code>--tat-color-surface-raised</code>", "Raised surfaces"],
          ["<code>--tat-color-surface-sunken</code>", "Footer and track backgrounds"],
          ["<code>--tat-color-background</code>", "Base background"],
          ["<code>--tat-color-text</code>", "Primary text"],
          ["<code>--tat-color-text-muted</code>", "Body text"],
          ["<code>--tat-color-text-subtle</code>", "Least important text"],
          ["<code>--tat-color-border</code>", "Borders and dividers"],
          ["<code>--tat-color-border-strong</code>", "High-contrast borders"],
          ["<code>--tat-color-focus-ring</code>", "Keyboard focus ring"],
          ["<code>--tat-color-overlay</code>", "The dimming backdrop"],
          ["<code>--tat-color-spotlight-ring</code>", "Outline around the target"],
        ]}
      />

      <h3>Typography</h3>

      <Table
        head={["Token", "Default"]}
        rows={[
          ["<code>--tat-font-family</code>", "System UI stack"],
          ["<code>--tat-font-size-sm</code>", "<code>0.75rem</code>"],
          ["<code>--tat-font-size-base</code>", "<code>0.875rem</code>"],
          ["<code>--tat-font-size-lg</code>", "<code>1rem</code>"],
          ["<code>--tat-line-height</code>", "<code>1.55</code>"],
          ["<code>--tat-heading-weight</code>", "<code>600</code>"],
          ["<code>--tat-heading-tracking</code>", "<code>-0.01em</code>"],
        ]}
      />

      <h3>Spacing, shape, elevation</h3>

      <Table
        head={["Token", "Purpose"]}
        rows={[
          [
            "<code>--tat-space-1</code> … <code>--tat-space-6</code>",
            "Spacing scale, 0.25rem to 1.5rem",
          ],
          [
            "<code>--tat-radius-sm</code> / <code>-md</code> / <code>-lg</code>",
            "6px / 10px / 14px",
          ],
          ["<code>--tat-radius-full</code>", "Pills and dots"],
          ["<code>--tat-border-width</code>", "<code>1px</code>"],
          ["<code>--tat-shadow-sm</code> / <code>-md</code> / <code>-lg</code>", "Elevation ramp"],
        ]}
      />

      <h3>Motion</h3>

      <Table
        head={["Token", "Default", "Purpose"]}
        rows={[
          ["<code>--tat-duration-fast</code>", "<code>120ms</code>", "Button feedback"],
          ["<code>--tat-duration-base</code>", "<code>200ms</code>", "Tooltip, overlay, spotlight"],
          ["<code>--tat-duration-slow</code>", "<code>320ms</code>", "Progress bar"],
          ["<code>--tat-ease-out</code>", "cubic", "Entrances"],
          ["<code>--tat-ease-in-out</code>", "cubic", "Loop and pulse"],
          ["<code>--tat-enter-distance</code>", "<code>6px</code>", "Entrance offset"],
          ["<code>--tat-enter-scale</code>", "<code>0.97</code>", "Modal entrance scale"],
        ]}
      />

      <h3>Layers</h3>

      <p>
        One contiguous stack. Move the whole thing with <code>--tat-z</code>, or set the{" "}
        <code>zIndex</code> option. Individual layers are deliberately not separately configurable.
      </p>

      <CodeBlock
        lang="css"
        code={`:root {
  --tat-z: 9990;              /* base */
  --tat-z-overlay:   calc(var(--tat-z) + 0);
  --tat-z-spotlight: calc(var(--tat-z) + 1);
  --tat-z-content:   calc(var(--tat-z) + 2);
}`}
      />

      <h2>Live theme customiser</h2>

      <p>
        Adjust the tokens below and start a tour to see the result immediately. These are ordinary
        CSS custom properties on this page — nothing is recompiled.
      </p>

      {customiser}
    </>
  );
}
