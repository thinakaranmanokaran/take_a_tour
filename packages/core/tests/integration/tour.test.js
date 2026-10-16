import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTour } from "../../src/public-api/create-tour.js";
import { __resetRegistry } from "../../src/registry/tour-registry.js";
import { __resetLock } from "../../src/registry/active-tour-lock.js";
import { TargetError, TransitionError } from "../../src/errors/index.js";

function target(id, text = id) {
  const el = document.createElement("button");
  el.setAttribute("data-tour-id", id);
  el.textContent = text;
  document.body.append(el);
  return el;
}

const CONFIG = {
  tourId: "integration",
  steps: [
    { tourId: "home.sidebar", title: "Navigate", content: "Your modules live here." },
    { tourId: "home.cta", title: "Create a project", content: "Start by creating one." },
    { tourId: "home.settings", title: "Settings", content: "Tune your workspace." },
  ],
};

describe("end-to-end tour lifecycle", () => {
  let tour;

  beforeEach(() => {
    document.body.innerHTML = "";
    document.head.innerHTML = "";
    __resetRegistry();
    __resetLock();
    target("home.sidebar");
    target("home.cta");
    target("home.settings");
  });

  afterEach(() => {
    tour?.destroy();
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  it("starts idle and renders the first step on start()", async () => {
    tour = createTour({ ...CONFIG, tourId: "start" });

    expect(tour.getState()).toBe("idle");
    expect(tour.getCurrentStep()).toBeNull();

    await tour.start();

    expect(tour.getState()).toBe("running");
    expect(tour.getCurrentStepIndex()).toBe(0);
    expect(tour.getCurrentStep().title).toBe("Navigate");

    const root = document.querySelector(".tat-root");
    expect(root).not.toBeNull();
    expect(root.querySelector(".tat-tooltip")).not.toBeNull();
    expect(root.querySelector(".tat-spotlight")).not.toBeNull();
  });

  it("navigates forward and backward", async () => {
    tour = createTour({ ...CONFIG, tourId: "nav" });
    await tour.start();

    await tour.next();
    expect(tour.getCurrentStep().title).toBe("Create a project");

    await tour.next();
    expect(tour.getCurrentStep().title).toBe("Settings");

    await tour.previous();
    expect(tour.getCurrentStep().title).toBe("Create a project");
  });

  it("completes on next() from the last step", async () => {
    tour = createTour({ ...CONFIG, tourId: "complete" });
    const onComplete = vi.fn();
    tour.on("complete", onComplete);

    await tour.start();
    await tour.next();
    await tour.next();
    await tour.next();

    expect(tour.getState()).toBe("completed");
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".tat-root")).toBeNull();
  });

  it("emits events in the documented order", async () => {
    tour = createTour({ ...CONFIG, tourId: "events" });
    const order = [];
    for (const name of ["start", "beforeStep", "stepChange", "afterStep"]) {
      tour.on(name, () => order.push(name));
    }

    await tour.start();
    expect(order).toEqual(["start", "beforeStep", "stepChange", "afterStep"]);

    order.length = 0;
    await tour.next();
    expect(order).toEqual(["beforeStep", "stepChange", "afterStep"]);
  });

  it("pauses and resumes without losing its place", async () => {
    tour = createTour({ ...CONFIG, tourId: "pause" });
    await tour.start();
    await tour.next();

    tour.pause();
    expect(tour.getState()).toBe("paused");
    expect(tour.getCurrentStepIndex()).toBe(1);
    expect(document.querySelector(".tat-root")?.dataset.tatState).toBe("paused");

    tour.resume();
    expect(tour.getState()).toBe("running");
    expect(document.querySelector(".tat-root")?.dataset.tatState).toBe("running");
  });

  it("distinguishes stop from skip from complete", async () => {
    const stopped = createTour({ ...CONFIG, tourId: "s-stop" });
    await stopped.start();
    stopped.stop();
    expect(stopped.getState()).toBe("stopped");

    const skipped = createTour({ ...CONFIG, tourId: "s-skip" });
    const onSkip = vi.fn();
    skipped.on("skip", onSkip);
    await skipped.start();
    skipped.skip();
    expect(skipped.getState()).toBe("skipped");
    expect(onSkip).toHaveBeenCalledOnce();

    const done = createTour({ ...CONFIG, tourId: "s-done" });
    await done.start();
    done.complete();
    expect(done.getState()).toBe("completed");

    stopped.destroy();
    skipped.destroy();
    done.destroy();
  });

  it("emits stop with the supplied reason", async () => {
    tour = createTour({ ...CONFIG, tourId: "reason" });
    const onStop = vi.fn();
    tour.on("stop", onStop);
    await tour.start();
    tour.stop("logout");

    expect(onStop).toHaveBeenCalledWith(expect.objectContaining({ reason: "logout" }));
  });

  it("can be restarted after stop()", async () => {
    tour = createTour({ ...CONFIG, tourId: "restart" });
    await tour.start();
    tour.stop();

    await tour.start();
    expect(tour.getState()).toBe("running");
    expect(tour.getCurrentStepIndex()).toBe(0);
    expect(document.querySelector(".tat-root")).not.toBeNull();
  });

  it("jumps to a step by identifier", async () => {
    tour = createTour({ ...CONFIG, tourId: "goto" });
    await tour.start();

    await tour.goTo("home.settings");
    expect(tour.getCurrentStep().title).toBe("Settings");

    await tour.goTo("home.sidebar");
    expect(tour.getCurrentStep().title).toBe("Navigate");
  });

  it("rejects goTo for an unknown identifier", async () => {
    tour = createTour({ ...CONFIG, tourId: "goto-bad" });
    await tour.start();

    await expect(tour.goTo("nope")).rejects.toThrowError(/No step with the identifier/);
  });

  it("starts at a configured step", async () => {
    tour = createTour({ ...CONFIG, tourId: "startat", startAt: 1 });
    await tour.start();

    expect(tour.getCurrentStepIndex()).toBe(1);
    expect(tour.getCurrentStep().title).toBe("Create a project");
  });

  it("loops when configured", async () => {
    tour = createTour({ ...CONFIG, tourId: "loop", loop: true });
    await tour.start();
    await tour.next();
    await tour.next();

    await tour.next();
    expect(tour.getCurrentStepIndex()).toBe(0);
    expect(tour.getState()).toBe("running");
  });

  it("excludes steps whose `when` predicate is false", async () => {
    tour = createTour({
      ...CONFIG,
      tourId: "conditional",
      steps: [
        { tourId: "home.cta", title: "Always", when: true },
        { tourId: "home.sidebar", title: "Never", when: false },
        { tourId: "home.settings", title: "Also", when: () => true },
      ],
    });

    await tour.start();
    expect(tour.getSteps()).toHaveLength(2);

    await tour.next();
    expect(tour.getCurrentStep().title).toBe("Also");
  });

  it("awaits an async `when` predicate", async () => {
    tour = createTour({
      ...CONFIG,
      tourId: "async-when",
      steps: [
        { tourId: "home.cta", title: "No", when: async () => false },
        { tourId: "home.sidebar", title: "Yes", when: async () => true },
      ],
    });

    await tour.start();
    expect(tour.getCurrentStep().title).toBe("Yes");
  });

  it("throws a readable error when a `when` predicate throws", async () => {
    tour = createTour({
      ...CONFIG,
      tourId: "when-throws",
      steps: [
        {
          tourId: "home.cta",
          title: "Boom",
          when: () => {
            throw new Error("predicate exploded");
          },
        },
      ],
    });

    await expect(tour.start()).rejects.toThrowError(/predicate exploded/);
  });

  it("uses step-level options over tour-level ones", async () => {
    tour = createTour({
      ...CONFIG,
      tourId: "overrides",
      placement: "top",
      steps: [
        { tourId: "home.cta", title: "A" },
        { tourId: "home.sidebar", title: "B", placement: "left" },
      ],
    });

    await tour.start();
    expect(tour.getConfig().placement).toBe("top");
    expect(tour.getConfig().steps[1].placement).toBe("left");
  });
});

describe("teardown and cleanup", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    target("home.cta");
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("leaves no DOM behind after destroy()", async () => {
    const tour = createTour({
      tourId: "cleanup",
      steps: [{ tourId: "home.cta", title: "A", content: "B" }],
    });

    await tour.start();
    expect(document.querySelectorAll(".tat-root")).toHaveLength(1);

    tour.destroy();

    expect(document.querySelectorAll(".tat-root")).toHaveLength(0);
    expect(document.querySelectorAll(".tat-tooltip")).toHaveLength(0);
    expect(document.querySelectorAll(".tat-overlay")).toHaveLength(0);
    expect(document.querySelectorAll(".tat-spotlight")).toHaveLength(0);
    expect(document.querySelectorAll(".tat-live")).toHaveLength(0);
  });

  it("leaves no DOM behind after stop()", async () => {
    const tour = createTour({
      tourId: "cleanup-stop",
      steps: [{ tourId: "home.cta", title: "A" }],
    });

    await tour.start();
    tour.stop();

    expect(document.querySelectorAll(".tat-root")).toHaveLength(0);
  });

  it("removes document listeners on destroy", async () => {
    const addSpy = vi.spyOn(document, "addEventListener");
    const removeSpy = vi.spyOn(document, "removeEventListener");

    const tour = createTour({
      tourId: "cleanup-listeners",
      steps: [{ tourId: "home.cta", title: "A" }],
    });

    addSpy.mockClear();
    removeSpy.mockClear();

    await tour.start();
    const added = addSpy.mock.calls.filter(([type]) => type === "keydown").length;
    expect(added).toBeGreaterThan(0);

    tour.destroy();
    const removed = removeSpy.mock.calls.filter(([type]) => type === "keydown").length;
    expect(removed).toBeGreaterThan(0);
  });

  it("releases the disposal stack completely", async () => {
    const tour = createTour({
      tourId: "cleanup-stack",
      steps: [{ tourId: "home.cta", title: "A" }],
    });

    await tour.start();
    tour.destroy();
    expect(tour.getState()).toBe("destroyed");
  });

  it("does not respond to keyboard input after destroy", async () => {
    const onStop = vi.fn();
    const tour = createTour({
      tourId: "cleanup-keys",
      closeOnEscape: true,
      steps: [{ tourId: "home.cta", title: "A" }],
    });
    tour.on("stop", onStop);

    await tour.start();
    tour.destroy();

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(onStop).not.toHaveBeenCalled();
  });

  it("ignores navigation after destroy", async () => {
    const tour = createTour({
      tourId: "cleanup-nav",
      steps: [
        { tourId: "home.cta", title: "A" },
        { tourId: "home.other", title: "B" },
      ],
    });
    target("home.other");

    await tour.start();
    tour.destroy();

    await expect(tour.next()).rejects.toThrowError(TransitionError);
    await expect(tour.previous()).rejects.toThrowError(TransitionError);
    expect(tour.getState()).toBe("destroyed");
  });

  it("is idempotent across repeated destroy calls", async () => {
    const onDestroy = vi.fn();
    const tour = createTour({
      tourId: "cleanup-idem",
      steps: [{ tourId: "home.cta", title: "A" }],
    });
    tour.on("destroy", onDestroy);

    await tour.start();
    tour.destroy();
    tour.destroy();
    tour.destroy();

    expect(onDestroy).toHaveBeenCalledTimes(1);
    expect(tour.getState()).toBe("destroyed");
  });
});

describe("concurrency", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    target("a");
    target("b");
  });

  afterEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  it("pauses the previous tour and resumes it when the new one finishes", async () => {
    const first = createTour({
      tourId: "first",
      concurrency: "pause-previous",
      steps: [{ tourId: "a", title: "A" }],
    });
    const second = createTour({
      tourId: "second",
      concurrency: "pause-previous",
      steps: [{ tourId: "b", title: "B" }],
    });

    await first.start();
    expect(first.getState()).toBe("running");

    await second.start();
    expect(first.getState()).toBe("paused");
    expect(second.getState()).toBe("running");
    expect(document.querySelectorAll(".tat-root")).toHaveLength(1);

    second.stop();
    expect(first.getState()).toBe("running");

    first.destroy();
    second.destroy();
  });

  it("rejects the second tour under the `reject` policy", async () => {
    const first = createTour({
      tourId: "r1",
      steps: [{ tourId: "a", title: "A" }],
    });
    const second = createTour({
      tourId: "r2",
      concurrency: "reject",
      steps: [{ tourId: "b", title: "B" }],
    });

    await first.start();
    await expect(second.start()).rejects.toThrowError(/already running/);

    first.destroy();
    second.destroy();
  });

  it("stops the previous tour under the `stop-previous` policy", async () => {
    const first = createTour({
      tourId: "s1",
      steps: [{ tourId: "a", title: "A" }],
    });
    const second = createTour({
      tourId: "s2",
      concurrency: "stop-previous",
      steps: [{ tourId: "b", title: "B" }],
    });

    await first.start();
    await second.start();

    expect(first.getState()).toBe("stopped");
    expect(second.getState()).toBe("running");
    expect(document.querySelectorAll(".tat-root")).toHaveLength(1);

    first.destroy();
    second.destroy();
  });

  it("never renders two overlays at once", async () => {
    const tours = ["c1", "c2", "c3"].map((id, index) =>
      createTour({
        tourId: id,
        concurrency: "stop-previous",
        steps: [{ tourId: index === 0 ? "a" : "b", title: id }],
      })
    );

    await tours[0].start();
    await tours[1].start();
    await tours[2].start();

    expect(document.querySelectorAll(".tat-root")).toHaveLength(1);
    expect(document.querySelectorAll(".tat-overlay")).toHaveLength(1);

    tours.forEach((tour) => tour.destroy());
  });
});

describe("missing targets", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  it("throws immediately under the `error` strategy", async () => {
    const tour = createTour({
      tourId: "missing-error",
      target: { missing: "error" },
      steps: [{ tourId: "nowhere", title: "Gone" }],
    });

    await expect(tour.start()).rejects.toThrowError(TargetError);
    expect(tour.getState()).not.toBe("running");
  });

  it("skips the step under the `skip` strategy", async () => {
    target("present");
    const tour = createTour({
      tourId: "missing-skip",
      target: { missing: "skip" },
      steps: [
        { tourId: "nowhere", title: "Gone" },
        { tourId: "present", title: "Here" },
      ],
    });

    await tour.start();
    expect(tour.getCurrentStep().title).toBe("Here");
  });

  it("renders centred without a spotlight under the `fallback` strategy", async () => {
    const tour = createTour({
      tourId: "missing-fallback",
      target: { missing: "fallback" },
      steps: [{ tourId: "nowhere", title: "Gone", content: "Still readable." }],
    });

    await tour.start();
    expect(tour.getState()).toBe("running");
    expect(document.querySelector(".tat-modal")).not.toBeNull();
    expect(document.querySelector(".tat-spotlight")?.style.opacity).toBe("0");
  });

  it("times out and reports the step when waiting fails", async () => {
    const onError = vi.fn();
    const tour = createTour({
      tourId: "missing-wait",
      target: { missing: "wait", timeout: 40 },
      steps: [{ tourId: "slow", title: "Slow" }],
    });
    tour.on("error", onError);

    await expect(tour.start()).rejects.toThrowError(/Timed out after 40ms/);
    expect(onError).toHaveBeenCalled();
  });

  it("resolves a target that appears after the wait begins", async () => {
    const tour = createTour({
      tourId: "late-target",
      target: { missing: "wait", timeout: 1000 },
      steps: [{ tourId: "late", title: "Late" }],
    });

    const started = tour.start();
    setTimeout(() => target("late"), 10);

    await started;
    expect(tour.getState()).toBe("running");
    expect(document.querySelector(".tat-tooltip")).not.toBeNull();
  });

  it("cancels a pending wait when the tour is destroyed", async () => {
    const tour = createTour({
      tourId: "cancelled-wait",
      target: { missing: "wait", timeout: 2000 },
      steps: [{ tourId: "never", title: "Never" }],
    });

    const started = tour.start();
    await new Promise((resolve) => setTimeout(resolve, 10));
    tour.destroy();

    await expect(started).rejects.toThrowError();
    expect(tour.getState()).toBe("destroyed");
  });
});

describe("duplicate DOM targets at runtime", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("reports ambiguity rather than picking the first element", async () => {
    target("dup");
    target("dup");

    const tour = createTour({
      tourId: "runtime-ambiguous",
      target: { missing: "error" },
      steps: [{ tourId: "dup", title: "Ambiguous" }],
    });

    await expect(tour.start()).rejects.toThrowError(/matches 2 elements/);
  });
});
