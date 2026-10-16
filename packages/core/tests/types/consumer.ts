/**
 * Type consumer test.
 *
 * Compiled with `tsc --noEmit`. Its purpose is to fail if the hand-written
 * declarations drift away from the implementation: every method used here is
 * checked against `types/index.d.ts`, and every documented event payload is
 * exercised so a renamed field breaks the build rather than a consumer's.
 */

import {
  configureTour,
  createTour,
  destroyAllTours,
  getTour,
  hasTour,
  listTours,
  PLACEMENTS,
  STATES,
  TakeATourError,
  TargetError,
  Theme,
  Tour,
  TourConfig,
  TourConfigError,
  TourEventMap,
  TourState,
  TourStep,
  TransitionError,
  VERSION,
} from "../../types/index.js";

const config: TourConfig = {
  tourId: "type-test",
  theme: "system",
  animation: "smooth",
  showProgress: true,
  keyboardNavigation: true,
  closeOnEscape: true,
  closeOnOverlayClick: false,
  scrollIntoView: true,
  spotlight: true,
  concurrency: "pause-previous",
  target: { missing: "wait", timeout: 3000 },
  persistence: { enabled: false, key: "type-test" },
  labels: { next: "Next", progress: "Step {current} of {total}" },
  classes: { tooltip: "my-tooltip" },
  startAt: 0,
  loop: false,
  steps: [
    {
      tourId: "home.cta",
      title: "Create your first project",
      content: (context) => `Step ${context.position + 1} of ${context.total}`,
      placement: "bottom",
      target: { occurrence: "first" },
    },
    {
      tourId: "home.sidebar",
      title: "Navigate",
      content: "Sidebar",
      placement: "right",
      optional: true,
      when: () => true,
    },
    { title: "Welcome", content: "Centred", centered: true },
  ],
  on: {
    stepChange: (payload) => {
      const title: string | undefined =
        typeof payload.step.title === "string" ? payload.step.title : undefined;
      void title;
      void payload.index;
      void payload.total;
    },
    complete: (payload) => {
      void payload.tour;
    },
  },
};

const tour: Tour = createTour(config);

// --- lifecycle -------------------------------------------------------------
const started: Promise<Tour> = tour.start();
void started;

tour.pause("user");
tour.resume();
tour.stop();
tour.skip();
tour.complete();

// --- navigation ------------------------------------------------------------
const next: Promise<Tour> = tour.next();
void next;

const previous: Promise<Tour> = tour.previous();
void previous;

const went: Promise<Tour> = tour.goTo("home.cta");
void went;

// --- inspection ------------------------------------------------------------
const state: TourState = tour.getState();
const active: boolean = tour.isActive();
const paused: boolean = tour.isPaused();
const step: TourStep | null = tour.getCurrentStep();
const index: number = tour.getCurrentStepIndex();
const sourceIndex: number = tour.getCurrentStepSourceIndex();
const steps: TourStep[] = tour.getSteps();
const theme: Theme = tour.getConfig().theme;
void [state, active, paused, step, index, sourceIndex, steps, theme];

// --- mutation --------------------------------------------------------------
tour.setTheme("dark");
tour.update({ theme: "light", showProgress: false });
tour.resetProgress();

// --- events ----------------------------------------------------------------
const offStart: () => void = tour.on("start", (payload: TourEventMap["start"]) => {
  void payload.step;
  void payload.tour.tourId;
});
offStart();

tour.on("error", (payload) => {
  const error: Error = payload.error;
  if (error instanceof TargetError) {
    void error.reason;
    void error.targetId;
  }
});
tour.once("destroy", () => {});
tour.off("destroy", () => {});

// --- module surface --------------------------------------------------------
configureTour({ defaults: { theme: "dark", animation: "none" } });
const themeId: string = "light";
const placement: (typeof PLACEMENTS)[number] = "bottom-start";
void [themeId, placement, STATES.RUNNING, VERSION, listTours(), getTour("type-test"), hasTour("x")];

// --- errors are catchable and typed ----------------------------------------
try {
  createTour({ tourId: "bad", steps: [] });
} catch (error) {
  if (error instanceof TourConfigError) void error.path;
  else if (error instanceof TransitionError) void error.from;
  else if (error instanceof TakeATourError) void error.code;
}

destroyAllTours();
tour.destroy();
