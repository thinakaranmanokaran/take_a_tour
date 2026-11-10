import { useState } from "react";
import { useTour } from "../hooks/useTour.js";
import { describeEvent } from "../lib/tour-status.js";

/**
 * Component gallery.
 *
 * Runs the real library against real targets on the page: a centred modal
 * first (a real dialog — `.tat-modal`, focus trapped), then anchored tooltip
 * steps that the browser test measures against `[data-tour-id="gallery.panel"]`.
 */

const STEPS = [
  {
    // Centred: a real modal dialog, focus trapped while open.
    title: "Centred modal",
    content: "Focus is trapped here and restored when the tour ends.",
    centered: true,
    icon: "sparkle",
  },
  {
    tourId: "gallery.panel",
    title: "Anchored tooltip",
    content: "Non-modal. Tab continues into the page once you have entered it.",
    placement: "right",
  },
  {
    tourId: "gallery.progress",
    title: "Progress indicator",
    content: "Enable showStepCounter to replace the bar with “Step 3 of 5”.",
    placement: "bottom",
  },
  {
    tourId: "gallery.actions",
    title: "Custom actions",
    content: "Buttons you define are rendered above the controls.",
    placement: "left",
    actions: [{ label: "Nice", primary: true }, { label: "Close the docs tab" }],
  },
];

export default function ComponentGallery() {
  const tour = useTour();
  const [status, setStatus] = useState("Idle. Start the tour to walk through each component.");

  const run = () =>
    tour.start(
      {
        tourId: "component-gallery",
        steps: STEPS,
        theme: tour.theme,
        showProgress: true,
        showStepCounter: true,
      },
      { onEvent: (name, payload) => setStatus(describeEvent(name, payload)) }
    );

  return (
    <div className="gallery" id="component-gallery">
      <p className="lede">Press Start to walk through each component in turn.</p>

      <div className="gallery__grid">
        <div className="gallery__demo" data-tour-id="gallery.panel">
          <strong>Anchored tooltip</strong>
          <span>Non-modal — Tab continues into the page.</span>
        </div>
        <div className="gallery__demo" data-tour-id="gallery.progress">
          <strong>Progress</strong>
          <span>Bar, counter and step dots share one style.</span>
        </div>
        <div className="gallery__demo" data-tour-id="gallery.actions">
          <strong>Custom actions</strong>
          <span>Rendered above the navigation controls.</span>
        </div>
      </div>

      <div className="gallery__controls">
        <button type="button" className="button button--primary" id="gallery-start" onClick={run}>
          {tour.active ? "Restart the gallery tour" : "Start the gallery tour"}
        </button>
        {tour.active && tour.totalSteps > 0 ? (
          <span className="pill">
            Step {tour.stepIndex + 1} of {tour.totalSteps}
          </span>
        ) : null}
      </div>

      <p className="demo-status" role="status" data-variant={tour.error ? "error" : undefined}>
        {tour.error ? tour.error.message : status}
      </p>
    </div>
  );
}
