import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetRegistry,
  destroyAllTours,
  getTour,
  hasTour,
  listTours,
} from "../../src/registry/tour-registry.js";
import { __resetLock, getActiveTour } from "../../src/registry/active-tour-lock.js";
import { createTour } from "../../src/public-api/create-tour.js";
import { TourConfigError } from "../../src/errors/index.js";

const CONFIG = {
  tourId: "registry-test",
  steps: [{ tourId: "home.cta", title: "Create", content: "Start here." }],
};

describe("tour registry", () => {
  beforeEach(() => {
    __resetRegistry();
    __resetLock();
  });

  afterEach(() => {
    destroyAllTours();
    __resetRegistry();
    __resetLock();
  });

  it("registers a tour and makes it retrievable by tourId", () => {
    const tour = createTour({ ...CONFIG, tourId: "alpha" });

    expect(hasTour("alpha")).toBe(true);
    expect(getTour("alpha")).toBe(tour);
    expect(listTours()).toContain(tour);
  });

  it("rejects a duplicate tourId instead of silently overwriting", () => {
    const first = createTour({ ...CONFIG, tourId: "duplicate" });

    expect(() => createTour({ ...CONFIG, tourId: "duplicate" })).toThrowError(TourConfigError);
    expect(() => createTour({ ...CONFIG, tourId: "duplicate" })).toThrowError(/already registered/);

    // The original instance must survive the rejected registration.
    expect(getTour("duplicate")).toBe(first);
    expect(first.getState()).toBe("idle");
  });

  it("destroys the previous instance when `replace: true` is used", () => {
    const first = createTour({ ...CONFIG, tourId: "replaceable" });
    const second = createTour({ ...CONFIG, tourId: "replaceable" }, { replace: true });

    expect(getTour("replaceable")).toBe(second);
    expect(first.getState()).toBe("destroyed");
  });

  it("does not register when `register: false`", () => {
    const tour = createTour({ ...CONFIG, tourId: "unregistered" }, { register: false });

    expect(hasTour("unregistered")).toBe(false);
    expect(listTours()).toHaveLength(0);
    tour.destroy();
  });

  it("destroyAllTours destroys every instance and empties the registry", () => {
    const a = createTour({ ...CONFIG, tourId: "a" });
    const b = createTour({ ...CONFIG, tourId: "b" });

    destroyAllTours();

    expect(a.getState()).toBe("destroyed");
    expect(b.getState()).toBe("destroyed");
    expect(listTours()).toHaveLength(0);
    expect(getActiveTour()).toBeNull();
  });

  it("destroyAllTours continues past a tour whose destroy throws", () => {
    const a = createTour({ ...CONFIG, tourId: "a" });
    const b = createTour({ ...CONFIG, tourId: "b" });

    vi.spyOn(a, "destroy").mockImplementation(() => {
      throw new Error("boom");
    });

    expect(() => destroyAllTours()).not.toThrow();
    expect(b.getState()).toBe("destroyed");
    expect(listTours()).toHaveLength(0);
  });

  it("removes a destroyed tour from the registry", () => {
    const tour = createTour({ ...CONFIG, tourId: "ephemeral" });
    tour.destroy();
    expect(hasTour("ephemeral")).toBe(false);
  });
});
