import CodeBlock from "../CodeBlock.jsx";
import Table from "../Table.jsx";
import Callout from "../Callout.jsx";
import { DOCS } from "../../data/nav.js";
import { url } from "../../config/site.js";

const version = "0.1.0";

export default function ApiReference() {
  return (
    <>
      <h1>API reference</h1>
      <p className="lede">
        The complete public surface of <code>@take-a-tour/core</code> v{version}. If it is not on
        this page, it is not public.
      </p>

      <h2>Exports</h2>

      <CodeBlock
        lang="js"
        code={`import {
  // primary
  createTour, configureTour,
  // registry
  getTour, hasTour, listTours, destroyAllTours,
  // constants
  STATES, EVENTS, PLACEMENTS, THEMES, ANIMATIONS,
  MISSING_TARGET_STRATEGIES, CONCURRENCY_POLICIES, DEFAULT_CONFIG,
  // errors
  TakeATourError, TourConfigError, TargetError, TransitionError, StorageError,
  // misc
  VERSION,
} from "@take-a-tour/core";

import "@take-a-tour/core/styles.css";`}
      />

      <h2>Functions</h2>

      <Table
        head={["Function", "Signature", "Notes"]}
        rows={[
          [
            "<code>createTour</code>",
            "<code>(config: TourConfig) => Tour</code>",
            "Validates, normalises, registers. Throws <code>TourConfigError</code> on bad input.",
          ],
          [
            "<code>configureTour</code>",
            "<code>({ defaults }) => { defaults }</code>",
            "Library-wide defaults. Per-tour config always wins.",
          ],
          ["<code>getTour</code>", "<code>(tourId) => Tour | undefined</code>", ""],
          ["<code>hasTour</code>", "<code>(tourId) => boolean</code>", ""],
          ["<code>listTours</code>", "<code>() => Tour[]</code>", "Registration order."],
          [
            "<code>destroyAllTours</code>",
            "<code>() => void</code>",
            "Used on logout or teardown.",
          ],
        ]}
      />

      <h2>Tour instance</h2>

      <h3>Lifecycle</h3>

      <Table
        head={["Method", "Returns", "Notes"]}
        rows={[
          [
            "<code>start(options?)</code>",
            "<code>Promise&lt;Tour&gt;</code>",
            "Resolves to the in-flight start if already running. <code>{ ignorePersistence: true }</code> skips resume.",
          ],
          [
            "<code>pause(reason?)</code>",
            "<code>Tour</code>",
            'Default reason <code>"user"</code>.',
          ],
          [
            "<code>resume()</code>",
            "<code>Tour</code>",
            "Rebuilds the overlay if the tour was displaced.",
          ],
          ["<code>stop(reason?)</code>", "<code>Tour</code>", "Resumable."],
          ["<code>skip(reason?)</code>", "<code>Tour</code>", "Terminal."],
          ["<code>complete()</code>", "<code>Tour</code>", "Terminal."],
          ["<code>destroy()</code>", "<code>Tour</code>", "Terminal and irreversible."],
        ]}
      />

      <h3>Navigation</h3>

      <Table
        head={["Method", "Returns", "Notes"]}
        rows={[
          [
            "<code>next()</code>",
            "<code>Promise&lt;Tour&gt;</code>",
            "Completes on the last step. Respects <code>loop</code>.",
          ],
          ["<code>previous()</code>", "<code>Promise&lt;Tour&gt;</code>", ""],
          [
            "<code>goTo(stepId)</code>",
            "<code>Promise&lt;Tour&gt;</code>",
            "Throws if no step has that identifier.",
          ],
        ]}
      />

      <h3>Inspection</h3>

      <Table
        head={["Method", "Returns", "Notes"]}
        rows={[
          ["<code>getState()</code>", "<code>TourState</code>", ""],
          ["<code>isActive()</code>", "<code>boolean</code>", "Running or paused."],
          ["<code>isPaused()</code>", "<code>boolean</code>", ""],
          ["<code>getCurrentStep()</code>", "<code>TourStep | null</code>", ""],
          [
            "<code>getCurrentStepIndex()</code>",
            "<code>number</code>",
            "Among applied steps. <code>-1</code> before start.",
          ],
          [
            "<code>getCurrentStepSourceIndex()</code>",
            "<code>number</code>",
            "Index in <code>config.steps</code>.",
          ],
          ["<code>getSteps()</code>", "<code>TourStep[]</code>", "Applied steps for this run."],
          ["<code>getConfig()</code>", "<code>ResolvedConfig</code>", "Deeply frozen snapshot."],
          ["<code>tourId</code>", "<code>string</code>", "Readable even after destroy."],
        ]}
      />

      <h3>Mutation and events</h3>

      <Table
        head={["Method", "Returns", "Notes"]}
        rows={[
          [
            "<code>update(patch)</code>",
            "<code>Tour</code>",
            "Re-validated before committing. Rejects unknown options and any change to <code>tourId</code>.",
          ],
          [
            "<code>setTheme(theme)</code>",
            "<code>Tour</code>",
            "Shorthand for <code>update({ theme })</code>.",
          ],
          ["<code>resetProgress()</code>", "<code>void</code>", "Clears persisted state."],
          ["<code>on(event, fn)</code>", "<code>() => void</code>", "Unsubscribe function."],
          ["<code>once(event, fn)</code>", "<code>() => void</code>", ""],
          ["<code>off(event, fn)</code>", "<code>void</code>", ""],
        ]}
      />

      <h2>Configuration</h2>

      <p>
        Full option-by-option reference, with defaults and types, is on
        <a href={url("/docs/configuration/")}>JSON configuration</a>.
      </p>

      <Table
        head={["Type", "Shape"]}
        rows={[
          ["<code>Theme</code>", '<code>"light" \\| "dark" \\| "system"</code>'],
          ["<code>Animation</code>", '<code>"none" \\| "instant" \\| "smooth"</code>'],
          [
            "<code>Placement</code>",
            "<code>top \\| top-start \\| top-end \\| bottom \\| bottom-start \\| bottom-end \\| left \\| left-start \\| left-end \\| right \\| right-start \\| right-end \\| center</code>",
          ],
          ["<code>Align</code>", '<code>"start" \\| "center" \\| "end"</code>'],
          [
            "<code>MissingTargetStrategy</code>",
            '<code>"error" \\| "skip" \\| "wait" \\| "fallback"</code>',
          ],
          [
            "<code>ConcurrencyPolicy</code>",
            '<code>"pause-previous" \\| "stop-previous" \\| "reject"</code>',
          ],
          [
            "<code>TourState</code>",
            "<code>idle \\| running \\| paused \\| completed \\| skipped \\| stopped \\| destroyed</code>",
          ],
          [
            "<code>LifecycleEvent</code>",
            "<code>start \\| beforeStep \\| stepChange \\| afterStep \\| pause \\| resume \\| skip \\| complete \\| stop \\| error \\| destroy</code>",
          ],
        ]}
      />

      <h2>Errors</h2>

      <Table
        head={["Class", "<code>code</code>", "Extra fields", "Thrown when"]}
        rows={[
          [
            "<code>TakeATourError</code>",
            "<code>TAT_ERROR</code>",
            "—",
            "Base class for everything below.",
          ],
          [
            "<code>TourConfigError</code>",
            "<code>TAT_CONFIG</code>",
            "<code>path</code>, <code>expected</code>, <code>received</code>",
            "Invalid configuration, at <code>createTour()</code> or <code>update()</code>.",
          ],
          [
            "<code>TargetError</code>",
            "<code>TAT_TARGET</code>",
            "<code>reason</code>, <code>targetId</code>, <code>matches</code>, <code>timeout</code>",
            "A target could not be resolved, or resolved ambiguously.",
          ],
          [
            "<code>TransitionError</code>",
            "<code>TAT_TRANSITION</code>",
            "<code>from</code>, <code>to</code>, <code>method</code>",
            "An illegal lifecycle transition.",
          ],
          [
            "<code>StorageError</code>",
            "<code>TAT_STORAGE</code>",
            "<code>adapter</code>",
            "A persistence adapter is invalid.",
          ],
        ]}
      />

      <p>
        <code>TargetError.reason</code> is one of <code>missing</code>, <code>ambiguous</code>,{" "}
        <code>invalid-selector</code>, <code>detached</code>, <code>hidden</code>,{" "}
        <code>timeout</code> or <code>aborted</code>.
      </p>

      <Callout title="Every documented method works">
        <p>
          The API reference is generated against the real exports, and a type-consumer fixture is
          compiled with <code>tsc --noEmit</code> during the release check. A method that stops
          existing or changes shape fails the build.
        </p>
      </Callout>

      <h2>TypeScript</h2>

      <p>
        The core is JavaScript, but a hand-written <code>types/index.d.ts</code> ships with the
        package, so TypeScript consumers get autocomplete and typed event payloads.
      </p>

      <CodeBlock
        lang="ts"
        code={`import { createTour, type Tour, type TourEventMap } from "@take-a-tour/core";

const tour: Tour = createTour({ tourId: "x", steps: [/* … */] });

tour.on("stepChange", (payload: TourEventMap["stepChange"]) => {
  const total: number = payload.total; // typed
});`}
      />

      <h2>Coverage</h2>

      <p>
        Every one of the {DOCS.length} documentation sections corresponds to a verified part of the
        implementation. Sections describing limitations are honest about what is <em>not</em>{" "}
        supported.
      </p>
    </>
  );
}
