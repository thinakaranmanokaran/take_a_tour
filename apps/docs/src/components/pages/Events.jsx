import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";

export default function Events() {
  return (
    <>
      <h1>Events and callbacks</h1>
      <p className="lede">
        Subscribe with <code>tour.on()</code> or declare <code>on</code> in the configuration. Both
        take the same path, so ordering and error handling are identical.
      </p>

      <h2>Subscribing</h2>

      <CodeBlock
        lang="js"
        code={`const off = tour.on("stepChange", ({ step, index, total }) => {
  console.log(\`\${index + 1}/\${total}: \${step.tourId ?? "(centred)"}\`);
});

// Returns an unsubscribe function.
off();

// Or declare it up front:
createTour({
  tourId: "x",
  on: {
    complete: () => analytics.track("tour_completed", { id: "x" }),
  },
  steps: [/* … */],
});`}
      />

      <p>
        Supplying new callbacks through <code>tour.update(&#123; on &#125;)</code> replaces the old
        ones rather than accumulating them.
      </p>

      <h2>Order</h2>

      <CodeBlock
        lang="text"
        code={`start()   →  start → beforeStep → stepChange → afterStep
next()    →              beforeStep → stepChange → afterStep
goTo()    →              beforeStep → stepChange → afterStep`}
      />

      <p>
        <code>start</code> fires once per run, before the first step is rendered. The remaining
        three fire for every step. <code>beforeStep</code> runs before the target is resolved, which
        makes it the place to change something the tour is about to point at.
      </p>

      <h2>Payloads</h2>

      <Table
        head={["Event", "Payload"]}
        rows={[
          ["<code>start</code>", "<code>{ tour, step, index, stepIndex, total }</code>"],
          [
            "<code>beforeStep</code>",
            "<code>{ tour, step, index, stepIndex, previousIndex, initial }</code>",
          ],
          [
            "<code>stepChange</code>",
            "<code>{ tour, step, index, stepIndex, previousIndex, total }</code>",
          ],
          ["<code>afterStep</code>", "<code>{ tour, step, index, stepIndex, total }</code>"],
          ["<code>pause</code>", "<code>{ tour, reason }</code>"],
          ["<code>resume</code>", "<code>{ tour }</code>"],
          ["<code>skip</code>", "<code>{ tour, reason }</code>"],
          ["<code>complete</code>", "<code>{ tour }</code>"],
          ["<code>stop</code>", "<code>{ tour, reason }</code>"],
          ["<code>error</code>", "<code>{ tour, error, phase?, stage?, step?, index? }</code>"],
          ["<code>destroy</code>", "<code>{ tour }</code>"],
        ]}
      />

      <h3>Index fields</h3>

      <ul>
        <li>
          <code>index</code> — position among the steps that applied to this run.
        </li>
        <li>
          <code>stepIndex</code> — position in your authored <code>steps</code> array, so you can
          map an event back to configuration.
        </li>
        <li>
          <code>previousIndex</code> — where the tour came from; <code>-1</code> on the first step.
        </li>
      </ul>

      <h2>A throwing listener cannot break the tour</h2>

      <p>
        Listener errors are caught, routed to <code>error</code>, and the engine continues. State is
        already committed by the time listeners run, so there is no half-finished transition to
        leave behind.
      </p>

      <CodeBlock
        lang="js"
        code={`tour.on("error", ({ error }) => {
  console.warn("tour listener failed:", error.message);
  // The tour is still running.
});

tour.on("complete", () => {
  throw new Error("analytics blew up"); // reported, not fatal
});

await tour.start();  // resolves normally`}
      />

      <Callout title="Async listeners are awaited">
        <p>
          A listener returning a promise is awaited before the next event fires, so ordering holds.
          A rejection is caught and reported like a synchronous throw.
        </p>
      </Callout>

      <h2>Errors</h2>

      <p>
        Anything that goes wrong — a missing target, an invalid placement at runtime, a renderer
        failure — arrives through <code>error</code>. Without a listener it is silently swallowed,
        because a tour failing should not crash the page around it.
      </p>

      <CodeBlock
        lang="js"
        code={`tour.on("error", ({ error, phase }) => {
  if (error instanceof TargetError) {
    report("tour_target_missing", { reason: error.reason, id: error.targetId });
  } else {
    report("tour_error", { message: error.message, phase });
  }
});`}
      />

      <h2>Reacting to steps</h2>

      <CodeBlock
        lang="js"
        code={`tour.on("beforeStep", async ({ step }) => {
  if (step.tourId === "home.cta") {
    // Make sure the element exists before the tour points at it.
    await ensureSidebarOpen();
  }
});`}
      />

      <h2>Once and off</h2>

      <CodeBlock
        lang="js"
        code={`tour.once("complete", () => showConfetti());

const handler = () => {};
tour.on("stepChange", handler);
tour.off("stepChange", handler);`}
      />

      <p>
        <code>once</code> and <code>on</code> both return an unsubscribe function, which is usually
        cleaner than keeping a reference to the handler.
      </p>
    </>
  );
}
