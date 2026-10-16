/**
 * Vanilla integration — no framework, no JSX, no build step beyond a dev server.
 *
 * The library is imported by its package name, exactly as a consumer would.
 */

import { createTour, configureTour, STATES } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";

configureTour({
  defaults: {
    theme: "system",
    animation: "smooth",
    closeOnEscape: true,
  },
});

const tour = createTour({
  // Identifies the tour. Distinct from every step's target identifier below.
  tourId: "acme-onboarding",

  steps: [
    {
      tourId: "home.sidebar",
      title: "Everything starts here",
      content: "Your navigation lives on the left. Every module in Acme is one click away.",
      placement: "right",
    },
    {
      tourId: "home.stats",
      title: "Your numbers at a glance",
      content: "Visitors, conversion and revenue update as your filters change.",
      placement: "bottom",
    },
    {
      tourId: "home.chart",
      title: "Traffic over time",
      content: "Hover any bar for the exact figure. Scroll the page — the tooltip follows.",
      placement: "top",
    },
    {
      tourId: "home.cta",
      title: "Ready to build something?",
      content: "Create a project and start collecting your own data.",
      placement: "left",
      actions: [
        {
          label: "Show me around again",
          onClick: () => {
            // Custom actions receive full control of the tour.
            tour.goTo("home.sidebar");
          },
        },
      ],
    },
  ],

  showProgress: true,
  keyboardNavigation: true,

  on: {
    complete() {
      console.log("Tour finished.");
    },
    skip() {
      console.log("Tour skipped.");
    },
  },
});

// Restarting is just another start() after a stop().
const startButton = document.querySelector("#start-tour");
startButton.addEventListener("click", () => {
  if (tour.getState() === STATES.DESTROYED) {
    console.warn("This tour was destroyed and cannot be restarted.");
    return;
  }
  tour.start();
});

// Exposed for the browser test suite and for poking at in the console.
window.tour = tour;
