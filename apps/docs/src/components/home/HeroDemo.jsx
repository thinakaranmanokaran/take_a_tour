import { useState } from "react";
import { describeEvent } from "../../lib/tour-status.js";
import { useTour } from "../../hooks/useTour.js";
import DemoControls from "../demo/DemoControls.jsx";
import SampleApp from "../demo/SampleApp.jsx";

/**
 * Hero demo — a real tour over the sample application, driven by the actual
 * package. Hydrated with `client:load` because it is the point of the hero.
 */

const HERO_STEPS = [
  {
    tourId: "hero.nav",
    title: "Real elements, measured live",
    content:
      "This spotlight is an overlay measured from the sidebar's bounding box. Resize the window and it follows.",
    placement: "right",
  },
  {
    tourId: "hero.create",
    title: "Steps are just JSON",
    content:
      "Each step names a data-tour-id and some copy. No mount points, no framework wrapping — this panel is static markup.",
    placement: "bottom",
  },
  {
    tourId: "hero.metrics",
    title: "It cleans up after itself",
    content:
      "Finish, skip, press Escape or click the overlay: every listener, observer and the overlay itself are removed.",
    placement: "top",
  },
];

export default function HeroDemo() {
  const tour = useTour();
  const [status, setStatus] = useState("Ready. The library chunk loads the moment you press Run.");

  const run = () => {
    tour.start(
      {
        tourId: "home.hero",
        theme: tour.theme,
        showProgress: true,
        animation: "smooth",
        steps: HERO_STEPS,
      },
      { onEvent: (name, payload) => setStatus(describeEvent(name, payload)) }
    );
  };

  const onNext = () => {
    if (tour.totalSteps > 0 && tour.stepIndex >= tour.totalSteps - 1) tour.complete();
    else tour.next();
  };

  return (
    <>
      <SampleApp prefix="hero" onCreate={run} url="app.acme.dev/overview" />

      <DemoControls
        running={tour.running}
        paused={tour.paused}
        stepIndex={tour.stepIndex}
        totalSteps={tour.totalSteps}
        onStart={run}
        onNext={onNext}
        onPrevious={tour.previous}
        onSkip={() => tour.skip("skipped from the hero demo")}
        onStop={() => tour.stop("stopped from the hero demo")}
        status={tour.error ? tour.error.message : status}
        statusVariant={tour.error ? "error" : undefined}
        startLabel="Run the real tour"
      />
    </>
  );
}
