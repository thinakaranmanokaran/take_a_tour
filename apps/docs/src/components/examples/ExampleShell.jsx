import { useState } from "react";
import { url } from "../../config/site.js";
import { useTour } from "../../hooks/useTour.js";
import { describeEvent } from "../../lib/tour-status.js";
import CodeBlock from "../CodeBlock.jsx";
import DemoControls from "../demo/DemoControls.jsx";
import SampleApp from "../demo/SampleApp.jsx";
import { EXAMPLES_BY_ID } from "./examples-data.js";

/**
 * One example on `/examples`: a live panel, its real configuration running on
 * demand, and the exact JavaScript that configuration corresponds to.
 *
 * The island only receives the example `id` as a prop — the data itself ships
 * in the JS chunk shared by all eight examples.
 */
export default function ExampleShell({ exampleId }) {
  const example = EXAMPLES_BY_ID[exampleId];
  const tour = useTour();
  const [status, setStatus] = useState("Idle. Press the button to run this configuration.");

  const onEvent = (name, payload) => setStatus(describeEvent(name, payload));

  const startExample = () =>
    tour.start({ ...example.config, theme: example.config.theme ?? tour.theme }, { onEvent });

  const onNext = () => {
    if (tour.totalSteps > 0 && tour.stepIndex >= tour.totalSteps - 1) tour.complete();
    else tour.next();
  };

  const jumpToStep = async () => {
    if (!tour.active) await startExample();
    const third = example.config.steps[2];
    if (third) tour.goTo(third.tourId);
  };

  const statusText = tour.error ? tour.error.message : status;

  return (
    <article
      className={`example${example.className ? ` ${example.className}` : ""}`}
      id={`example-${example.id}`}
    >
      <header className="example__head">
        <h2 className="example__title">{example.title}</h2>
        <span className="example__tag">{example.tag}</span>
      </header>
      <p className="example__lede">{example.description}</p>

      <div className="example__grid">
        <div className="example__panel">
          <SampleApp prefix={example.prefix} variant={example.panel} onCreate={startExample} />

          {example.mode === "programmatic" ? (
            <div className="demo-controls">
              <button type="button" className="button button--primary" onClick={startExample}>
                {tour.active ? "Restart" : "Start the tour"}
              </button>
              <button type="button" className="button" onClick={jumpToStep}>
                Jump to step 3
              </button>
              <button
                type="button"
                className="button"
                onClick={() => tour.pause("paused from the example")}
                disabled={!tour.running}
              >
                Pause
              </button>
              <button
                type="button"
                className="button"
                onClick={() => tour.resume()}
                disabled={!tour.paused}
              >
                Resume
              </button>
              <button
                type="button"
                className="button"
                onClick={() => tour.destroy()}
                disabled={!tour.active}
              >
                Destroy
              </button>
              {tour.active && tour.totalSteps > 0 ? (
                <span className="pill demo-controls__step">
                  Step {tour.stepIndex + 1} of {tour.totalSteps}
                </span>
              ) : null}
            </div>
          ) : (
            <DemoControls
              running={tour.running}
              paused={tour.paused}
              stepIndex={tour.stepIndex}
              totalSteps={tour.totalSteps}
              onStart={startExample}
              onNext={onNext}
              onPrevious={tour.previous}
              onSkip={() => tour.skip("skipped from the example")}
              onStop={() => tour.stop("stopped from the example")}
              status={statusText}
              statusVariant={tour.error ? "error" : undefined}
              startLabel="Start the tour"
            />
          )}

          {example.mode === "programmatic" ? (
            <p
              className="demo-status"
              role="status"
              data-variant={tour.error ? "error" : undefined}
            >
              {statusText}
            </p>
          ) : null}
        </div>

        <div className="example__code">
          <CodeBlock lang="js" title={example.codeTitle} code={example.code} />
          {example.extraCode ? (
            <CodeBlock
              lang={example.extraCode.lang}
              title={example.extraCode.title}
              code={example.extraCode.code}
            />
          ) : null}
          <a className="example__docs-link" href={url(example.docHref)}>
            {example.docLabel} →
          </a>
        </div>
      </div>
    </article>
  );
}
