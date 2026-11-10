import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";
import { url } from "../../config/site.js";

export default function Configuration() {
  return (
    <>
      <h1>JSON configuration</h1>
      <p className="lede">
        A tour is described by a plain object. Wherever callbacks and DOM references are not
        required, it stays JSON-serialisable.
      </p>

      <CodeBlock
        lang="js"
        code={`const tour = createTour({
  tourId: "dashboard-onboarding",
  steps: [
    { tourId: "home.sidebar", title: "Your navigation", content: "Access the sections.", placement: "right" },
    { tourId: "home.cta", title: "Create a project", content: "Start by creating one.", placement: "bottom" },
  ],
  theme: "system",
  animation: "smooth",
  showProgress: true,
  keyboardNavigation: true,
  closeOnEscape: true,
  closeOnOverlayClick: false,
  scrollIntoView: true,
  spotlight: true,
  persistence: { enabled: false, key: "dashboard-onboarding" },
});`}
      />

      <h2>Precedence</h2>

      <p>Five sources contribute, each overriding the one before it:</p>

      <ol>
        <li>Built-in defaults</li>
        <li>
          Global defaults from <code>configureTour(&#123; defaults &#125;)</code>
        </li>
        <li>Tour configuration</li>
        <li>Step configuration (read at step time, not merged in)</li>
        <li>
          Runtime overrides from <code>tour.update()</code>
        </li>
      </ol>

      <p>
        The merged result is validated, deep-cloned and frozen. Your original object is never
        mutated, and the snapshot you get from <code>tour.getConfig()</code> is deeply frozen.
      </p>

      <Callout title="An invalid update changes nothing">
        <p>
          <code>tour.update()</code> validates the merged result <em>before</em> committing. If it
          throws, the tour keeps its previous configuration and keeps running.
        </p>
      </Callout>

      <h2>Tour options</h2>

      <Table
        head={["Option", "Type", "Default", "Notes"]}
        rows={[
          [
            "<code>tourId</code>",
            "<code>string</code>",
            "—",
            "Required, non-empty, unique. Immutable after creation.",
          ],
          ["<code>steps</code>", "<code>Step[]</code>", "—", "Required, at least one."],
          [
            "<code>startAt</code>",
            "<code>number \\| string</code>",
            "<code>0</code>",
            "Index or target identifier to begin at.",
          ],
          [
            "<code>loop</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Wrap around at the ends.",
          ],
          [
            "<code>theme</code>",
            '<code>"light" \\| "dark" \\| "system"</code>',
            '<code>"system"</code>',
            "Per-tour theme; resolved from the OS in <code>system</code>.",
          ],
          [
            "<code>animation</code>",
            '<code>"none" \\| "instant" \\| "smooth"</code>',
            '<code>"smooth"</code>',
            '<code>"none"</code> disables all transitions.',
          ],
          [
            "<code>spotlight</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Dim the page and cut out the target.",
          ],
          [
            "<code>spotlightPadding</code>",
            "<code>number</code>",
            "<code>6</code>",
            "Gap around the target, in pixels.",
          ],
          [
            "<code>spotlightRadius</code>",
            "<code>number</code>",
            "<code>8</code>",
            "Corner radius of the cut-out.",
          ],
          [
            "<code>showProgress</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Progress bar in the footer.",
          ],
          [
            "<code>showStepCounter</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Replace the bar with a <code>Step 2 of 5</code> counter.",
          ],
          [
            "<code>showCloseButton</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Close control in the tooltip header.",
          ],
          [
            "<code>keyboardNavigation</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Arrows, Escape, Home, End.",
          ],
          [
            "<code>closeOnEscape</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Escape ends the tour.",
          ],
          [
            "<code>closeOnOverlayClick</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Clicking the backdrop ends the tour.",
          ],
          [
            "<code>allowTargetInteraction</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Let the user click the highlighted element.",
          ],
          [
            "<code>scrollIntoView</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Scroll the target into view on each step.",
          ],
          [
            "<code>waitForTarget</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Permit waiting for a missing target.",
          ],
          ["<code>tooltipWidth</code>", "<code>number</code>", "<code>320</code>", "120–2000."],
          [
            "<code>zIndex</code>",
            "<code>number</code>",
            "<code>9990</code>",
            "Base of the whole layer stack.",
          ],
          [
            "<code>placement</code>",
            "<code>Placement</code>",
            '<code>"bottom"</code>',
            "Default side for anchored tooltips.",
          ],
          [
            "<code>offset</code>",
            "<code>{ x, y }</code>",
            "<code>{ x: 0, y: 12 }</code>",
            "Gap between target and tooltip.",
          ],
          [
            "<code>announce</code>",
            "<code>boolean</code>",
            "<code>true</code>",
            "Live-region announcements.",
          ],
          [
            "<code>concurrency</code>",
            "<code>ConcurrencyPolicy</code>",
            '<code>"pause-previous"</code>',
            "What happens when another tour is running.",
          ],
          [
            "<code>target</code>",
            "<code>object</code>",
            '<code>{ missing: "wait", timeout: 3000, occurrence: "error" }</code>',
            "Missing-target behaviour.",
          ],
          [
            "<code>persistence</code>",
            "<code>object</code>",
            "<code>{ enabled: false }</code>",
            "Progress storage. Off by default.",
          ],
          [
            "<code>labels</code>",
            "<code>object</code>",
            "see below",
            "Accessible and visible strings.",
          ],
          [
            "<code>classes</code>",
            "<code>object</code>",
            "<code>{}</code>",
            "Extra class names merged onto components.",
          ],
          [
            "<code>intro</code>",
            "<code>Dialog \\| null</code>",
            "<code>null</code>",
            "Centred welcome dialog.",
          ],
          [
            "<code>completion</code>",
            "<code>Dialog \\| null</code>",
            "<code>null</code>",
            "Centred completion dialog.",
          ],
          [
            "<code>on</code>",
            "<code>object</code>",
            "<code>{}</code>",
            `Lifecycle callbacks. <a href="${url("/docs/events/")}">See events</a>.`,
          ],
          [
            "<code>unsafeHTML</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            `Opt in to authored markup. <a href="${url("/docs/security/")}">Read first</a>.`,
          ],
          [
            "<code>debug</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Log library state to the console.",
          ],
        ]}
      />

      <h2>Step options</h2>

      <Table
        head={["Option", "Type", "Default", "Notes"]}
        rows={[
          [
            "<code>tourId</code>",
            "<code>string</code>",
            "—",
            "Target identifier. Optional for centred steps.",
          ],
          [
            "<code>title</code>",
            "<code>string \\| fn</code>",
            "—",
            "Rendered with <code>textContent</code>.",
          ],
          [
            "<code>content</code>",
            "<code>string \\| fn</code>",
            "—",
            "Body text. At least one of title, content or actions is required.",
          ],
          [
            "<code>placement</code>",
            "<code>Placement</code>",
            "tour value",
            "13 supported values.",
          ],
          [
            "<code>align</code>",
            '<code>"start" \\| "center" \\| "end"</code>',
            '<code>"center"</code>',
            "Cross-axis alignment.",
          ],
          [
            "<code>offset</code>",
            "<code>{ x, y }</code>",
            "tour value",
            "Overrides the tour offset.",
          ],
          ["<code>theme</code>", "<code>Theme</code>", "tour value", "Per-step theme override."],
          [
            "<code>target</code>",
            "<code>object</code>",
            "—",
            "<code>selector</code>, <code>element</code>, <code>occurrence</code>, <code>missing</code>.",
          ],
          [
            "<code>when</code>",
            "<code>boolean \\| fn</code>",
            "<code>true</code>",
            "Conditional inclusion. May be async.",
          ],
          [
            "<code>optional</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Allows <code>goTo()</code> to jump past this step.",
          ],
          [
            "<code>centered</code>",
            "<code>boolean</code>",
            "<code>false</code>",
            "Marks a step with no target.",
          ],
          [
            "<code>timeout</code>",
            "<code>number</code>",
            "tour value",
            "Milliseconds to wait for this target.",
          ],
          [
            "<code>waitForTarget</code>",
            "<code>boolean</code>",
            "tour value",
            "Per-step override.",
          ],
          ["<code>spotlightPadding</code>", "<code>number</code>", "tour value", ""],
          ["<code>spotlightRadius</code>", "<code>number</code>", "tour value", ""],
          ["<code>icon</code>", "<code>string</code>", "—", "Icon name for centred steps."],
          [
            "<code>actions</code>",
            "<code>Action[]</code>",
            "—",
            "<code>{ label, onClick?, primary? }</code>.",
          ],
          [
            "<code>unsafeContent</code>",
            "<code>string</code>",
            "—",
            "Only read when the tour sets <code>unsafeHTML</code>.",
          ],
        ]}
      />

      <h2>Placements</h2>

      <CodeBlock
        lang="text"
        code={`top      top-start  top-end
bottom   bottom-start  bottom-end
left     left-start  left-end
right    right-start  right-end
center`}
      />

      <p>
        If the preferred side does not have room, the engine scores the alternatives and picks the
        best one. If the tooltip still cannot fit, it is clamped inside the viewport rather than
        allowed to overflow.
      </p>

      <h2>Default labels</h2>

      <CodeBlock
        lang="js"
        code={`{
  previous: "Previous",
  next: "Next",
  done: "Done",
  skip: "Skip tour",
  close: "Close tour",
  stepLabel: "Step",
  progress: "Step {current} of {total}",
}`}
      />

      <p>
        Override any of them with <code>labels</code>. The <code>progress</code> template supports
        <code>&#123;current&#125;</code> and <code>&#123;total&#125;</code>.
      </p>
    </>
  );
}
