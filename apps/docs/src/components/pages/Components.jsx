import Callout from "../Callout.jsx";
import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";

/**
 * `/docs/components` — the component inventory. The live gallery is a hydrated
 * island passed in from the route shell, because everything else here is
 * static.
 */
export default function Components({ gallery }) {
  return (
    <>
      <h1>Built-in components</h1>
      <p className="lede">
        Twelve components, one visual language. They all resolve to the same tokens, the same radius
        scale, the same shadow ramp and the same transition timings.
      </p>

      <h2>The surfaces</h2>

      <h3>Tooltip</h3>

      <p>
        The anchored popover used for steps with a target. Non-modal: focus enters once, then Tab
        continues through the page.
      </p>

      <CodeBlock
        lang="js"
        code={`{ tourId: "home.cta", title: "Create", content: "Start here.", placement: "bottom" }`}
      />

      <h3>Modal</h3>

      <p>
        The centred dialog used for <code>placement: "center"</code>, <code>centered: true</code>,{" "}
        <code>intro</code> and <code>completion</code>. A real modal: focus is trapped while it is
        open and restored when it closes.
      </p>

      <CodeBlock
        lang="js"
        code={`createTour({
  tourId: "x",
  intro: {
    title: "Welcome to Acme",
    content: "A two-minute tour of the essentials.",
    icon: "sparkle",
    actions: [{ label: "Let's go", primary: true, onClick: () => {} }],
  },
  completion: {
    title: "You're all set",
    content: "You can replay this tour any time from Help.",
    icon: "check-circle",
  },
  steps: [/* … */],
});`}
      />

      <h2>The chrome</h2>

      <Table
        head={["Component", "Class", "Notes"]}
        rows={[
          [
            "Overlay",
            "<code>.tat-overlay</code>",
            "Click-through unless <code>closeOnOverlayClick</code>",
          ],
          ["Spotlight", "<code>.tat-spotlight</code>", "<code>aria-hidden</code>; decorative"],
          ["Arrow", "<code>.tat-arrow</code>", "Hidden when the tooltip is centred"],
          [
            "Progress bar",
            "<code>.tat-progress__bar</code>",
            '<code>role="progressbar"</code> with min/max/now',
          ],
          [
            "Step counter",
            "<code>.tat-tooltip__counter</code>",
            "Enabled with <code>showStepCounter</code>",
          ],
          ["Previous", "<code>.tat-btn--previous</code>", "Hidden on the first step"],
          [
            "Next / Done",
            "<code>.tat-btn--primary</code>",
            "Label and icon change on the last step",
          ],
          ["Skip", "<code>.tat-btn--skip</code>", "Shown only when there is something after it"],
          ["Close", "<code>.tat-btn--icon</code>", "<code>showCloseButton</code>"],
          ["Custom actions", "<code>.tat-actions</code>", "From <code>step.actions</code>"],
          [
            "Live region",
            "<code>.tat-live</code>",
            '<code>role="status"</code>, <code>aria-live="polite"</code>',
          ],
          ["Root", "<code>.tat-root</code>", "The single owned container"],
        ]}
      />

      <h2>Custom action buttons</h2>

      <CodeBlock
        lang="js"
        code={`{
  tourId: "home.cta",
  title: "Create a project",
  content: "Projects hold your dashboards.",
  actions: [
    { label: "Create one now", primary: true, onClick: () => openCreateModal() },
    { label: "Learn more", onClick: () => openDocs("#projects") },
  ],
}`}
      />

      <h2>Component gallery</h2>

      {gallery}

      <Callout title="One design system, not twelve">
        <p>
          Spacing, radius, shadows, typography and motion all come from the same custom properties.
          If you override <code>--tat-radius-lg</code>, the tooltip, the modal and the welcome
          dialog all change together. That is the point.
        </p>
      </Callout>

      <h2>Renaming classes</h2>

      <p>Add your own classes without forking or rewriting the stylesheet:</p>

      <CodeBlock
        lang="js"
        code={`createTour({
  tourId: "x",
  classes: {
    root: "my-product-tour",
    tooltip: "my-product-tour__panel",
    overlay: "my-product-tour__scrim",
  },
  steps: [/* … */],
});`}
      />

      <p>
        The library's own classes are always kept, so nothing breaks — your classes are merged
        alongside them.
      </p>

      <h2>Icons</h2>

      <p>
        Six local SVG icons ship with the library: <code>chevron-left</code>,{" "}
        <code>chevron-right</code>, <code>close</code>, <code>check</code>,{" "}
        <code>check-circle</code> and <code>sparkle</code>. No icon package is a dependency and
        nothing is fetched from a CDN. Every icon is <code>aria-hidden</code> — the accessible name
        belongs to the button that contains it.
      </p>
    </>
  );
}
