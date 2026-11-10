import CodeBlock from "../CodeBlock.jsx";
import Callout from "../Callout.jsx";
import { url } from "../../config/site.js";

export default function Troubleshooting() {
  return (
    <>
      <h1>Troubleshooting</h1>
      <p className="lede">
        Every error below is a real message from the library, with the fix next to it.
      </p>

      <h2>Configuration</h2>

      <h3>
        <code>A tour with tourId "x" is already registered</code>
      </h3>

      <p>Two live instances share an id. That is usually a component remounting without cleanup.</p>

      <CodeBlock
        lang="js"
        code={`// Find the leak:
console.log(listTours().map((tour) => tour.tourId));

// Fix the cleanup, or deliberately take over:
const tour = createTour(config, { replace: true }); // destroys the previous instance

// Or on teardown:
destroyAllTours();`}
      />

      <h3>
        <code>Must contain at least one step</code>
      </h3>

      <p>
        <code>steps</code> is empty. If steps are filtered by <code>when</code>, the error at
        <em>start</em> is different: <em>Every step was excluded by its \`when\` predicate</em>.
      </p>

      <h3>
        <code>A step must define a target identifier … or be explicitly centred</code>
      </h3>

      <p>
        A step has neither a <code>tourId</code>, a <code>target.selector</code>, nor
        <code>target.element</code>. Either give it a target, or mark it
        <code>centered: true</code> / <code>placement: \"center\"</code>.
      </p>

      <h3>
        <code>Placement "diagonal" is not supported</code>
      </h3>

      <p>
        Check <code>PLACEMENTS</code> for the thirteen valid values. Errors carry the config path,
        so
        <code>error.path</code> tells you exactly which step is wrong.
      </p>

      <h3>
        An <code>update()</code> that throws
      </h3>

      <p>
        <code>update()</code> validates the merged result before committing, so a throw leaves the
        tour exactly as it was. Fix the value and try again.
      </p>

      <h2>Targets</h2>

      <h3>
        <code>matches 2 elements</code>
      </h3>

      <p>
        Two elements share a <code>data-tour-id</code>. The library will not guess.
      </p>

      <CodeBlock
        lang="js"
        code={`// Fix the markup — usually correct.
//
// Or declare the intent on every step that shares the id:
{ tourId: "home.cta", title: "…", target: { occurrence: "first" } }
{ tourId: "home.cta", title: "…", target: { occurrence: 1 } }`}
      />

      <h3>
        <code>Timed out after 3000ms waiting for \"home.cta\"</code>
      </h3>

      <p>The element never appeared, or never became visible.</p>

      <ul>
        <li>
          Is the <code>data-tour-id</code> value an exact match, including the dot?
        </li>
        <li>
          Is the element inside a shadow root? Use <code>target.element</code>.
        </li>
        <li>
          Is it rendered conditionally and simply has not mounted yet? Raise <code>timeout</code>.
        </li>
        <li>Is it inside a hidden container? Hidden counts as unusable.</li>
      </ul>

      <CodeBlock lang="js" code={`steps: [{ tourId: "app.panel", title: "…", timeout: 15000 }]`} />

      <h3>
        <code>exists but is hidden</code>
      </h3>

      <p>
        An ancestor has <code>display: none</code>, <code>visibility: hidden</code>, or the
        <code>hidden</code> attribute. Visibility checks walk the whole ancestor chain, not just the
        element.
      </p>

      <h3>Nothing happens when the tour starts</h3>

      <p>
        Usually the stylesheet was not imported, so the overlay renders unstyled behind your
        content.
      </p>

      <CodeBlock lang="js" code={`import "@take-a-tour/core/styles.css";`} />

      <h2>Layout</h2>

      <h3>The tooltip is in the wrong place</h3>

      <ul>
        <li>
          Is an ancestor using <code>transform</code>, <code>filter</code> or
          <code>will-change</code>? Those create a containing block that breaks
          <code>position: fixed</code>.
        </li>
        <li>Is the target inside a container with its own stacking context and a high z-index?</li>
        <li>
          Has the page got a scrollbar that appeared after mount? The viewport is measured again on
          resize, but a scrollbar appearing mid-step needs one.
        </li>
      </ul>

      <h3>The tooltip covers its own target</h3>

      <p>
        Try a different placement, or add an offset. The engine flips when a side does not fit, but
        on a very small viewport every side may be tight.
      </p>

      <CodeBlock lang="js" code={`{ tourId: "a", placement: "right", offset: { x: 24, y: 0 } }`} />

      <h3>It does not follow when I scroll</h3>

      <p>
        Repositioning is driven by <code>ResizeObserver</code> plus scroll and resize listeners. If
        a container scrolls in a way that emits no scroll event — a CSS transform animation, for
        example — the tour cannot see it.
      </p>

      <h2>Lifecycle</h2>

      <h3>
        <code>Cannot call next() while the tour is \"idle\"</code>
      </h3>

      <p>
        Call <code>start()</code> first. Navigation methods throw when the tour is not running.
      </p>

      <h3>
        <code>Cannot call start() after destroy()</code>
      </h3>

      <p>
        <code>destroy()</code> is permanent. Create a new tour instead — you can reuse the same
        <code>tourId</code>, because destroy released it.
      </p>

      <h3>
        <code>Cannot call start() while the tour is \"completed\"</code>
      </h3>

      <p>
        Completion is terminal. To show the tour again, either create a new instance, or call
        <code>stop()</code> before restarting — but only if it is actually in the
        <code>stopped</code> state.
      </p>

      <h3>Nothing is removed after destroy</h3>

      <p>
        Check for a second implementation. The real <code>destroy()</code> is verified to leave zero
        roots, zero overlays and zero document listeners.
      </p>

      <h2>Diagnosis</h2>

      <CodeBlock
        lang="js"
        code={`tour.on("error", ({ error, phase, stage }) => {
  console.error("[tour]", error.code, error.message, { phase, stage });
});

console.log(tour.getState());
console.log(tour.getCurrentStep());
console.table(tour.getSteps().map((s, i) => ({ i, targetId: s.tourId, placement: s.placement })));`}
      />

      <CodeBlock
        lang="js"
        code={`// Turn on library logging.
createTour({ tourId: "x", debug: true, steps: [/* … */] });`}
      />

      <Callout title="Still stuck">
        <p>
          Reduce it to a <a href={url("/playground/")}>playground</a> configuration. If it
          reproduces there, it is the library; if it does not, the difference is in your markup —
          almost always a duplicate <code>data-tour-id</code> or a target inside a shadow root.
        </p>
      </Callout>
    </>
  );
}
