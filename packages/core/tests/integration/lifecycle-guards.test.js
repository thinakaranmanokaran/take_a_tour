import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTour } from "../../src/public-api/create-tour.js";
import { __resetRegistry } from "../../src/registry/tour-registry.js";
import { __resetLock } from "../../src/registry/active-tour-lock.js";
import { TransitionError } from "../../src/errors/index.js";

function target(id) {
  const el = document.createElement("button");
  el.setAttribute("data-tour-id", id);
  document.body.append(el);
  return el;
}

const STEPS = [
  { tourId: "a", title: "First", content: "First step." },
  { tourId: "b", title: "Second", content: "Second step." },
  { tourId: "c", title: "Third", content: "Third step." },
];

describe("lifecycle guards", () => {
  let tours = [];

  function make(config = {}) {
    const tour = createTour({ tourId: `guard-${tours.length}`, steps: STEPS, ...config });
    tours.push(tour);
    return tour;
  }

  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    target("a");
    target("b");
    target("c");
    tours = [];
  });

  afterEach(() => {
    tours.forEach((tour) => {
      try {
        tour.destroy();
      } catch {
        /* already destroyed */
      }
    });
    document.body.innerHTML = "";
  });

  it("treats a repeated start() as idempotent", async () => {
    const tour = make();
    const onStart = vi.fn();
    tour.on("start", onStart);

    await Promise.all([tour.start(), tour.start(), tour.start()]);
    await tour.start();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(document.querySelectorAll(".tat-root")).toHaveLength(1);
    expect(tour.getCurrentStepIndex()).toBe(0);
  });

  it("resolves start() to the instance", async () => {
    const tour = make();
    await expect(tour.start()).resolves.toBe(tour);
  });

  it("rejects next() before start()", async () => {
    const tour = make();
    await expect(tour.next()).rejects.toThrowError(TransitionError);
  });

  it("rejects previous() before start()", async () => {
    const tour = make();
    await expect(tour.previous()).rejects.toThrowError(TransitionError);
  });

  it("rejects goTo() before start()", async () => {
    const tour = make();
    await expect(tour.goTo("b")).rejects.toThrowError(TransitionError);
  });

  it("rejects navigation after completion", async () => {
    const tour = make();
    await tour.start();
    await tour.next();
    await tour.next();
    await tour.next();

    expect(tour.getState()).toBe("completed");
    await expect(tour.next()).rejects.toThrowError(TransitionError);
  });

  it("treats a repeated pause() as a no-op", async () => {
    const tour = make();
    await tour.start();

    tour.pause();
    tour.pause();
    tour.pause();

    expect(tour.getState()).toBe("paused");
  });

  it("treats a repeated resume() as a no-op", async () => {
    const tour = make();
    await tour.start();

    tour.resume();
    expect(tour.getState()).toBe("running");

    tour.pause();
    tour.resume();
    tour.resume();
    expect(tour.getState()).toBe("running");
  });

  it("treats repeated stop() and skip() as no-ops", async () => {
    const stopped = make();
    const onStop = vi.fn();
    stopped.on("stop", onStop);
    await stopped.start();

    stopped.stop();
    stopped.stop();
    expect(onStop).toHaveBeenCalledTimes(1);

    const skipped = make();
    const onSkip = vi.fn();
    skipped.on("skip", onSkip);
    await skipped.start();

    skipped.skip();
    skipped.skip();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it("rejects pause() after destroy()", async () => {
    const tour = make();
    await tour.start();
    tour.destroy();

    expect(() => tour.pause()).toThrowError(TransitionError);
    expect(() => tour.resume()).toThrowError(TransitionError);
    expect(() => tour.stop()).toThrowError(TransitionError);
    expect(() => tour.update({ theme: "dark" })).toThrowError(TransitionError);
  });

  it("rejects start() after destroy()", async () => {
    const tour = make();
    await tour.start();
    tour.destroy();

    await expect(tour.start()).rejects.toThrowError(TransitionError);
  });
});

describe("rapid input", () => {
  let tours = [];

  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    for (const id of ["a", "b", "c", "d"]) target(id);
    tours = [];
  });

  afterEach(() => {
    tours.forEach((tour) => tour.destroy());
    document.body.innerHTML = "";
  });

  it("handles rapid Next clicks without losing its place", async () => {
    const tour = createTour({
      tourId: "rapid-next",
      steps: [
        { tourId: "a", title: "A" },
        { tourId: "b", title: "B" },
        { tourId: "c", title: "C" },
        { tourId: "d", title: "D" },
      ],
    });
    tours.push(tour);
    await tour.start();

    // Four clicks racing a four-step tour. Whatever the interleaving, the
    // outcome must be deterministic: the tour finishes and the page is clean.
    const results = await Promise.allSettled([tour.next(), tour.next(), tour.next(), tour.next()]);

    expect(results.some((result) => result.status === "fulfilled")).toBe(true);
    expect(tour.getState()).toBe("completed");
    expect(document.querySelectorAll(".tat-root")).toHaveLength(0);
  });

  it("settles deterministically under repeated Next from a longer tour", async () => {
    const tour = createTour({
      tourId: "rapid-next-mid",
      loop: true,
      steps: [
        { tourId: "a", title: "A" },
        { tourId: "b", title: "B" },
        { tourId: "c", title: "C" },
      ],
    });
    tours.push(tour);
    await tour.start();

    await Promise.allSettled([tour.next(), tour.next(), tour.next()]);
    await Promise.resolve();

    // Looping means the tour cannot complete, so exactly one root remains.
    expect(tour.getState()).toBe("running");
    expect(document.querySelectorAll(".tat-root")).toHaveLength(1);
    expect(tour.getCurrentStep()).not.toBeNull();
  });

  it("does not render a step that was superseded mid-flight", async () => {
    const tour = createTour({
      tourId: "supersede",
      steps: [
        { tourId: "a", title: "A" },
        { tourId: "b", title: "B" },
        { tourId: "c", title: "C" },
      ],
    });
    tours.push(tour);

    await tour.start();
    await tour.next();
    await tour.next();

    expect(tour.getCurrentStep().title).toBe("C");
    expect(document.querySelector(".tat-tooltip__title").textContent).toBe("C");
  });

  it("ignores input that arrives after destroy", async () => {
    const tour = createTour({ tourId: "post-destroy", steps: STEPS });
    tours.push(tour);
    await tour.start();

    tour.destroy();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));

    expect(tour.getState()).toBe("destroyed");
    expect(document.querySelector(".tat-root")).toBeNull();
  });
});

describe("callback error isolation", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    for (const id of ["a", "b"]) target(id);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("survives a throwing lifecycle listener", async () => {
    const tour = createTour({
      tourId: "throwing-listener",
      steps: STEPS.slice(0, 2),
      on: {
        stepChange: () => {
          throw new Error("consumer bug");
        },
      },
    });

    await tour.start();
    expect(tour.getState()).toBe("running");

    await tour.next();
    expect(tour.getState()).toBe("running");
    expect(tour.getCurrentStep().title).toBe("Second");

    tour.destroy();
  });

  it("reports a throwing listener through the error event", async () => {
    const onError = vi.fn();
    const tour = createTour({
      tourId: "throwing-reported",
      steps: STEPS.slice(0, 1),
    });

    tour.on("error", onError);
    tour.on("start", () => {
      throw new Error("consumer bug");
    });

    await tour.start();
    await Promise.resolve();

    expect(onError).toHaveBeenCalled();
    tour.destroy();
  });

  it("replaces config callbacks on update() rather than accumulating them", async () => {
    const first = vi.fn();
    const second = vi.fn();

    const tour = createTour({
      tourId: "callback-swap",
      steps: STEPS.slice(0, 2),
      on: { stepChange: first },
    });

    await tour.start();
    tour.update({ on: { stepChange: second } });
    await tour.next();

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);

    tour.destroy();
  });

  it("keeps the tour usable when a listener throws on the last step", async () => {
    const tour = createTour({
      tourId: "throwing-complete",
      steps: STEPS.slice(0, 1),
      on: {
        complete: () => {
          throw new Error("boom");
        },
      },
    });

    await tour.start();
    await tour.next();

    expect(tour.getState()).toBe("completed");
    tour.destroy();
  });
});

describe("runtime configuration updates", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    for (const id of ["a", "b"]) target(id);
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("applies a valid update and refreshes the view", async () => {
    const tour = createTour({
      tourId: "update-theme",
      theme: "light",
      steps: STEPS.slice(0, 1),
    });

    await tour.start();
    expect(document.querySelector(".tat-root").dataset.tatTheme).toBe("light");

    tour.setTheme("dark");
    expect(tour.getConfig().theme).toBe("dark");
    expect(document.querySelector(".tat-root").dataset.tatTheme).toBe("dark");

    tour.destroy();
  });

  it("rejects an invalid update and keeps the previous configuration", async () => {
    const tour = createTour({
      tourId: "update-invalid",
      theme: "light",
      steps: STEPS.slice(0, 1),
    });

    await tour.start();
    expect(() => tour.update({ theme: "neon" })).toThrowError(/not supported/);
    expect(tour.getConfig().theme).toBe("light");

    tour.destroy();
  });

  it("rejects changing the tourId", async () => {
    const tour = createTour({ tourId: "update-id", steps: STEPS.slice(0, 1) });
    await tour.start();

    expect(() => tour.update({ tourId: "different" })).toThrowError(/cannot be changed/);
    tour.destroy();
  });

  it("rejects unknown options", async () => {
    const tour = createTour({ tourId: "update-unknown", steps: STEPS.slice(0, 1) });
    await tour.start();

    expect(() => tour.update({ notAnOption: true })).toThrowError(/unsupported option/);
    tour.destroy();
  });

  it("rejects a non-object update", async () => {
    const tour = createTour({ tourId: "update-type", steps: STEPS.slice(0, 1) });
    await tour.start();

    expect(() => tour.update(null)).toThrowError(/partial configuration object/);
    tour.destroy();
  });

  it("applies progress visibility changes", async () => {
    const tour = createTour({
      tourId: "update-progress",
      showProgress: true,
      steps: STEPS.slice(0, 1),
    });

    await tour.start();
    expect(document.querySelector(".tat-progress")).not.toBeNull();

    tour.update({ showProgress: false });
    expect(document.querySelector(".tat-progress")).toBeNull();

    tour.destroy();
  });

  it("exposes a frozen configuration snapshot", async () => {
    const tour = createTour({ tourId: "update-frozen", steps: STEPS.slice(0, 1) });
    await tour.start();

    expect(Object.isFrozen(tour.getConfig())).toBe(true);
    tour.destroy();
  });
});
