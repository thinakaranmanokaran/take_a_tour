/**
 * Route-change integration.
 *
 * The hard case for a tour library: the router tears down the DOM the tour is
 * pointing at, then mounts new markup a frame later. Three techniques handle
 * it, and each is a documented option rather than a trick.
 *
 *   1. `target: { missing: "wait" }` — the tour waits for the new markup.
 *   2. Re-resolve on every step change, which the library already does.
 *   3. Stop the tour on a route you do not want to annotate.
 */

import { createTour } from "@take-a-tour/core";
import "@take-a-tour/core/styles.css";
import "./style.css";

// A deliberately tiny router: enough to demonstrate the problem, not more.
const routes = {
  "/": { title: "Overview", targets: ["route.overview", "route.kpi"] },
  "/reports": { title: "Reports", targets: ["route.builder", "run.schedule"] },
  "/billing": { title: "Billing", targets: ["route.plan", "route.invoices"] },
};

const app = document.querySelector("#app");

function render(path) {
  const route = routes[path] ?? routes["/"];
  const links = Object.keys(routes)
    .map(
      (key) =>
        `<a href="${key}" data-link class="nav__link${key === path ? " nav__link--active" : ""}">${routes[key].title}</a>`
    )
    .join("");

  app.innerHTML = `
    <div class="shell">
      <nav class="nav">${links}</nav>
      <main class="main">
        <h1>${route.title}</h1>
        <section class="card" data-tour-id="route.overview">
          <h2>Summary</h2>
          <p class="muted">Every route renders fresh markup.</p>
        </section>
        <section class="card" data-tour-id="route.kpi">
          <h2>Key metric</h2>
          <p class="muted">Mounted after this route resolves.</p>
        </section>
        <section class="card" data-tour-id="route.builder">
          <h2>Query builder</h2>
          <p class="muted">Only exists on /reports.</p>
        </section>
        <section class="card" data-tour-id="run.schedule">
          <h2>Schedule</h2>
          <p class="muted">Only exists on /reports.</p>
        </section>
        <section class="card" data-tour-id="route.plan">
          <h2>Plan</h2>
          <p class="muted">Only exists on /billing.</p>
        </section>
        <section class="card" data-tour-id="route.invoices">
          <h2>Invoices</h2>
          <p class="muted">Only exists on /billing.</p>
        </section>
        <button class="btn" id="start">Take the tour</button>
        <button class="btn btn--primary" id="restart">Restart</button>
      </main>
    </div>
  `;

  // Intercept link clicks — no full page reload, exactly like a real SPA.
  for (const link of app.querySelectorAll("[data-link]")) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("href"));
    });
  }

  app.querySelector("#start").addEventListener("click", () => tour.start());
  app.querySelector("#restart").addEventListener("click", () => {
    tour.destroy();
    create();
  });
}

let currentPath = window.location.pathname;
let tour = null;

function create() {
  tour = createTour({
    tourId: "spa-route-tour",
    steps: [
      {
        tourId: "route.overview",
        title: "This card only exists on Overview",
        content: "Switch routes mid-tour and the next step waits for its own card.",
        placement: "right",
      },
      {
        tourId: "route.builder",
        title: "Navigate to /reports",
        content:
          "Click Reports in the sidebar. This step is waiting for markup that is not here yet.",
        placement: "bottom",
        // The whole point: wait for the router, up to five seconds.
        timeout: 5000,
      },
      {
        tourId: "run.schedule",
        title: "Scheduling lives here too",
        content: "Same route, second target.",
        placement: "left",
      },
    ],
    // Without this the tour would error out the moment the router swapped the
    // DOM out from under it.
    target: { missing: "wait" },
    waitForTarget: true,
    theme: "system",
    on: {
      error(payload) {
        console.warn("Tour stopped:", payload.error.message);
      },
    },
  });

  window.tour = tour;
}

function navigate(path) {
  currentPath = path;
  history.pushState({}, "", path);
  render(path);
}

window.addEventListener("popstate", () => {
  currentPath = window.location.pathname;
  render(currentPath);
});

create();
render(currentPath);
