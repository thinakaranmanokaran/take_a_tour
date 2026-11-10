import { useState } from "react";
import { describeEvent } from "../../lib/tour-status.js";
import { useTour } from "../../hooks/useTour.js";
import { SHOWCASE_CONFIG } from "./showcase-config.js";
import DemoControls from "../demo/DemoControls.jsx";
import SampleApp from "../demo/SampleApp.jsx";

/**
 * Interactive feature showcase — the same configuration the home page prints
 * in its configuration section, run over the sample application.
 * Hydrated with `client:visible` (it is below the fold).
 */
export default function FeatureShowcase() {
  const tour = useTour();
  const [status, setStatus] = useState("Idle. Start the tour to see the configuration below run.");

  const run = () => {
    tour.start(
      { ...SHOWCASE_CONFIG, theme: tour.theme },
      { onEvent: (name, payload) => setStatus(describeEvent(name, payload)) }
    );
  };

  const onNext = () => {
    if (tour.totalSteps > 0 && tour.stepIndex >= tour.totalSteps - 1) tour.complete();
    else tour.next();
  };

  return (
    <>
      <SampleApp prefix="showcase" onCreate={run} url="app.acme.dev/reports" />

      <DemoControls
        running={tour.running}
        paused={tour.paused}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        onStart={run}
        onNext={onNext}
        onPrevious={tour.previous}
        onSkip={() => tour.skip("skipped from the showcase")}
        onStop={() => tour.stop("stopped from the showcase")}
        status={tour.error ? tour.error.message : status}
        statusVariant={tour.error ? "error" : undefined}
        startLabel="Start the tour"
      />
    </>
  );
}
