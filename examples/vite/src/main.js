/**
 * Bundled Vite integration: live theme switching and CSS-variable overrides.
 */

import { createTour, configureTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";
import "./style.css";

configureTour({ defaults: { animation: "smooth", keyboardNavigation: true } });

const tour = createTour({
  tourId: "vite-demo",
  steps: [
    {
      tourId: "vite.button",
      title: "The main action",
      content: "This is the button people are looking for. Try pressing →.",
      placement: "right",
    },
    {
      tourId: "vite.secondary",
      title: "Secondary action",
      content: "Less important, but still reachable.",
      placement: "top",
    },
    {
      tourId: "vite.custom",
      title: "Fully customisable",
      content:
        "The colour and width on the right are plain CSS variables. Nothing is re-compiled to change them.",
      placement: "left",
      actions: [
        {
          label: "Restart tour",
          primary: true,
          onClick: () => {
            tour.goTo("vite.button");
          },
        },
      ],
    },
  ],
  theme: "system",
  showProgress: true,
  showCloseButton: true,
});

document.querySelector("#start").addEventListener("click", () => tour.start());

// --- theme switching --------------------------------------------------------
const themeButtons = document.querySelectorAll("[data-theme]");

function applyTheme(theme) {
  tour.setTheme(theme);
  for (const button of themeButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.theme === theme));
  }
}

for (const button of themeButtons) {
  button.addEventListener("click", () => applyTheme(button.dataset.theme));
}

// --- CSS variable overrides -------------------------------------------------
// Documented, supported, and requiring no rebuild.
const brand = document.querySelector("#brand");
brand.addEventListener("input", () => {
  document.documentElement.style.setProperty("--tat-color-primary", brand.value);
});

const width = document.querySelector("#width");
width.addEventListener("input", () => {
  document.documentElement.style.setProperty("--tat-tooltip-width", `${width.value}px`);
});

window.tour = tour;
