import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";

export default function Accessibility() {
  return (
    <>
      <h1>Accessibility</h1>
      <p className="lede">
        Accessibility is built into the components, not bolted on. Here is exactly what is
        implemented and how it is verified.
      </p>

      <h2>Keyboard</h2>

      <Table
        head={["Key", "Action", "Enabled by"]}
        rows={[
          ["<kbd>Tab</kbd>", "Move through the tour's controls", "<code>keyboardNavigation</code>"],
          ["<kbd>→</kbd>", "Next step", "<code>keyboardNavigation</code>"],
          ["<kbd>←</kbd>", "Previous step", "<code>keyboardNavigation</code>"],
          [
            "<kbd>Home</kbd> / <kbd>End</kbd>",
            "First / last step",
            "<code>keyboardNavigation</code>",
          ],
          ["<kbd>Esc</kbd>", "End the tour", "<code>closeOnEscape</code>"],
          [
            "<kbd>Enter</kbd> / <kbd>Space</kbd>",
            "Activate the focused button",
            "Native button behaviour",
          ],
        ]}
      />

      <CodeBlock
        lang="js"
        code={`createTour({
  tourId: "x",
  keyboardNavigation: true,  // default
  closeOnEscape: true,       // default
  steps: [/* … */],
});`}
      />

      <p>
        Arrow keys are ignored while focus is inside a text field or a contenteditable element, so
        typing in your page's search box never advances the tour. Modified combinations (
        <kbd>Ctrl</kbd>, <kbd>Meta</kbd>, <kbd>Alt</kbd>) are left to the browser.
      </p>

      <h2>Focus management</h2>

      <h3>Anchored tooltips are not modal</h3>

      <p>
        Focus moves into the tooltip once, so a keyboard user is not stranded behind the overlay.
        After that, <kbd>Tab</kbd> continues normally through the page. Focus is{" "}
        <strong>not</strong> trapped, because trapping a non-modal popover makes the page behind it
        unreachable.
      </p>

      <h3>Centred steps are modal</h3>

      <p>
        A centred step is a real dialog, so focus is trapped inside it for as long as it is open,
        and
        <kbd>Tab</kbd> cycles within it.
      </p>

      <h3>Restoration</h3>

      <p>
        Whatever had focus when the tour started gets it back when the tour ends — for any reason:
        completion, skip, stop, or destroy.
      </p>

      <CodeBlock
        lang="js"
        code={`button.addEventListener("click", () => tour.start());
// … tour ends …
button === document.activeElement;  // true`}
      />

      <h2>Screen readers</h2>

      <ul>
        <li>
          The surface is a <code>role="dialog"</code> with <code>aria-labelledby</code> pointing at
          the step heading.
        </li>
        <li>
          Anchored tooltips are <code>aria-modal="false"</code>; centred steps are
          <code>aria-modal="true"</code>.
        </li>
        <li>
          A polite live region announces each step's title and position. The region is present from
          mount, because a live region added at the same moment as its text is often missed.
        </li>
        <li>
          The spotlight is <code>aria-hidden</code> — it is decorative, and announcing a rectangle
          would be noise.
        </li>
        <li>
          Progress uses <code>role="progressbar"</code> with <code>aria-valuemin</code>,
          <code>aria-valuemax</code> and <code>aria-valuenow</code>.
        </li>
      </ul>

      <Callout title="Icons are never the name">
        <p>
          Every icon is <code>aria-hidden</code>. The accessible name comes from the button's
          <code>aria-label</code>, which is derived from your <code>labels</code> configuration. A
          chevron shape is not a name.
        </p>
      </Callout>

      <h2>Colour and contrast</h2>

      <p>
        The light and dark palettes are chosen for at least 4.5:1 contrast on body text and 3:1 on
        large text and control borders. <code>@media (prefers-contrast: more)</code> strengthens
        borders and thickens focus rings.
      </p>

      <CodeBlock
        lang="css"
        code={`:root {
  --tat-color-primary: #4f46e5;
  /* Still >= 4.5:1 on white when you change these. */
}`}
      />

      <h2>Reduced motion</h2>

      <p>
        All motion uses <code>opacity</code> and <code>transform</code> — never layout properties —
        and
        <code>prefers-reduced-motion: reduce</code> collapses every transition to 1ms and removes
        entrance animations while preserving their end state.
      </p>

      <CodeBlock
        lang="js"
        code={`// Turn motion off in configuration, regardless of the OS setting.
createTour({ tourId: "x", animation: "none", steps: [/* … */] });

// Or shorten it.
createTour({ tourId: "x", animation: "instant", steps: [/* … */] });`}
      />

      <h2>Target interaction</h2>

      <p>
        By default the backdrop intercepts clicks so the user cannot wander off mid-tour. When a
        step explains something the user should actually use, let them:
      </p>

      <CodeBlock
        lang="js"
        code={`createTour({
  tourId: "x",
  allowTargetInteraction: true,  // the highlighted element stays clickable
  steps: [
    { tourId: "app.filter", title: "Filter your data", content: "Try it — click the filter." },
  ],
});`}
      />

      <p>
        This does not disable all host-page interaction for every tour; it is opt-in per tour, and
        only affects the backdrop.
      </p>

      <h2>How this is verified</h2>

      <ul>
        <li>
          <strong>Unit and integration</strong> — semantics, focus movement and restoration, focus
          trapping, live-region text, keyboard handling, all asserted against a DOM.
        </li>
        <li>
          <strong>Real browser (Chromium)</strong> — the same properties plus an axe-core scan of
          the tour's own DOM, failing the build on any <em>critical</em> violation.
        </li>
        <li>
          <strong>Automated checks are not conformance.</strong> Full WCAG validation also needs
          manual testing with real assistive technology and expert review, which has not been
          performed here.
        </li>
      </ul>
    </>
  );
}
