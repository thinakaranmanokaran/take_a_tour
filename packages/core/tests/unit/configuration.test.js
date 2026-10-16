import { describe, expect, it } from "vitest";
import { validateConfig } from "../../src/configuration/validate.js";
import { TourConfigError } from "../../src/errors/index.js";
import { normalizeConfig, mergeConfig, cloneConfig } from "../../src/configuration/normalize.js";

const base = {
  tourId: "demo",
  steps: [{ tourId: "home.cta", title: "Create", content: "Start here." }],
};

function expectConfigError(run, matcher) {
  try {
    run();
    expect.unreachable("expected a TourConfigError");
  } catch (error) {
    expect(error).toBeInstanceOf(TourConfigError);
    expect(error.code).toBe("TAT_CONFIG");
    if (matcher) expect(error.message).toMatch(matcher);
  }
}

describe("configuration validation", () => {
  it("accepts a minimal valid configuration", () => {
    expect(() => validateConfig(base)).not.toThrow();
  });

  it("rejects a non-object configuration", () => {
    expectConfigError(() => validateConfig(null), /requires a configuration object/);
    expectConfigError(() => validateConfig("nope"), /requires a configuration object/);
  });

  it("requires a non-empty tourId", () => {
    expectConfigError(() => validateConfig({ ...base, tourId: undefined }), /`tourId`/);
    expectConfigError(() => validateConfig({ ...base, tourId: "" }), /must not be empty/);
    expectConfigError(() => validateConfig({ ...base, tourId: 42 }), /must be a string/);
  });

  it("requires at least one step", () => {
    expectConfigError(() => validateConfig({ ...base, steps: [] }), /at least one step/);
    expectConfigError(() => validateConfig({ ...base, steps: "x" }), /must be an array/);
  });

  it("validates every step independently and reports the failing index", () => {
    const config = {
      ...base,
      steps: [base.steps[0], { tourId: "home.two", title: "Two", placement: "diagonal" }],
    };

    try {
      validateConfig(config);
      expect.unreachable("expected a TourConfigError");
    } catch (error) {
      expect(error.path).toBe("steps[1].placement");
      expect(error.expected).toContain("bottom");
    }
  });

  it("accepts all twelve supported placements", () => {
    const placements = [
      "top",
      "top-start",
      "top-end",
      "bottom",
      "bottom-start",
      "bottom-end",
      "left",
      "left-start",
      "left-end",
      "right",
      "right-start",
      "right-end",
      "center",
    ];

    for (const placement of placements) {
      expect(() =>
        validateConfig({ ...base, steps: [{ tourId: "a", title: "t", placement }] })
      ).not.toThrow();
    }
  });

  it("requires a step to be renderable", () => {
    expectConfigError(
      () => validateConfig({ ...base, steps: [{ tourId: "a" }] }),
      /needs `title`, `content`, or `actions`/
    );
  });

  it("requires a step to be targeted or explicitly centred", () => {
    expectConfigError(
      () => validateConfig({ ...base, steps: [{ title: "Hello" }] }),
      /must define a target identifier/
    );

    expect(() =>
      validateConfig({ ...base, steps: [{ title: "Hello", centered: true }] })
    ).not.toThrow();

    expect(() =>
      validateConfig({ ...base, steps: [{ title: "Hello", placement: "center" }] })
    ).not.toThrow();
  });

  it("allows a selector or element target without a tourId", () => {
    expect(() =>
      validateConfig({ ...base, steps: [{ title: "t", target: { selector: "#main" } }] })
    ).not.toThrow();

    const element = document.createElement("div");
    expect(() =>
      validateConfig({ ...base, steps: [{ title: "t", target: { element } }] })
    ).not.toThrow();
  });

  it("rejects both selector and element on the same step", () => {
    const element = document.createElement("div");
    expectConfigError(
      () =>
        validateConfig({
          ...base,
          steps: [{ title: "t", target: { selector: "#a", element } }],
        }),
      /not both/
    );
  });

  it("rejects duplicate target identifiers within one tour", () => {
    const config = {
      ...base,
      steps: [
        { tourId: "home.cta", title: "One" },
        { tourId: "home.cta", title: "Two" },
      ],
    };

    try {
      validateConfig(config);
      expect.unreachable("expected a TourConfigError");
    } catch (error) {
      expect(error.message).toMatch(/used by more than one step/);
      expect(error.message).toMatch(/steps\[1\]/);
    }
  });

  it("allows duplicate identifiers when every sharing step opts in explicitly", () => {
    expect(() =>
      validateConfig({
        ...base,
        steps: [
          { tourId: "home.cta", title: "One", target: { occurrence: "first" } },
          { tourId: "home.cta", title: "Two", target: { occurrence: "first" } },
        ],
      })
    ).not.toThrow();
  });

  it("rejects unknown themes, animations and concurrency policies", () => {
    expectConfigError(() => validateConfig({ ...base, theme: "neon" }), /`theme`/);
    expectConfigError(() => validateConfig({ ...base, animation: "bouncy" }), /`animation`/);
    expectConfigError(() => validateConfig({ ...base, concurrency: "many" }), /`concurrency`/);
  });

  it("rejects unknown lifecycle events in `on`", () => {
    expectConfigError(
      () => validateConfig({ ...base, on: { explode: () => {} } }),
      /Unknown lifecycle event/
    );
    expect(() => validateConfig({ ...base, on: { complete: () => {} } })).not.toThrow();
  });

  it("rejects non-function callbacks", () => {
    expectConfigError(
      () => validateConfig({ ...base, on: { start: "nope" } }),
      /must be a function/
    );
  });

  it("validates persistence settings", () => {
    expect(() =>
      validateConfig({ ...base, persistence: { enabled: true, adapter: "localStorage" } })
    ).not.toThrow();

    expectConfigError(
      () => validateConfig({ ...base, persistence: { enabled: "yes" } }),
      /`persistence.enabled`/
    );
  });

  it("rejects out-of-range numbers", () => {
    expectConfigError(() => validateConfig({ ...base, tooltipWidth: 10 }), /between 120 and 2000/);
    expectConfigError(
      () => validateConfig({ ...base, target: { timeout: -1 } }),
      /between 0 and 600000/
    );
  });

  it("accepts a `when` predicate and an async one", () => {
    expect(() =>
      validateConfig({ ...base, steps: [{ tourId: "a", title: "t", when: () => true }] })
    ).not.toThrow();
    expectConfigError(
      () => validateConfig({ ...base, steps: [{ tourId: "a", title: "t", when: "yes" }] }),
      /must be a boolean or a predicate/
    );
  });
});

describe("configuration normalization", () => {
  it("does not mutate the caller's object", () => {
    const input = {
      tourId: "demo",
      steps: [{ tourId: "a", title: "A" }],
      labels: { next: "Onwards" },
    };
    const snapshot = JSON.parse(JSON.stringify(input));

    normalizeConfig(input);

    expect(input).toEqual(snapshot);
  });

  it("deep-clones rather than aliasing nested objects", () => {
    const input = { ...base, labels: { next: "Onwards" } };
    const config = normalizeConfig(input);

    expect(config.labels).not.toBe(input.labels);
    expect(config.labels.next).toBe("Onwards");
  });

  it("applies documented defaults for options the caller omitted", () => {
    const config = normalizeConfig(base);

    expect(config.theme).toBe("system");
    expect(config.animation).toBe("smooth");
    expect(config.showProgress).toBe(true);
    expect(config.keyboardNavigation).toBe(true);
    expect(config.closeOnEscape).toBe(true);
    expect(config.closeOnOverlayClick).toBe(false);
    expect(config.target.missing).toBe("wait");
    expect(config.persistence.enabled).toBe(false);
  });

  it("lets the caller override defaults", () => {
    const config = normalizeConfig({ ...base, theme: "dark", showProgress: false });
    expect(config.theme).toBe("dark");
    expect(config.showProgress).toBe(false);
  });

  it("derives the persistence key from the tourId", () => {
    expect(normalizeConfig(base).persistence.key).toBe("take-a-tour:demo");
    expect(normalizeConfig({ ...base, persistence: { key: "custom" } }).persistence.key).toBe(
      "custom"
    );
  });

  it("returns a frozen configuration", () => {
    const config = normalizeConfig(base);

    expect(Object.isFrozen(config)).toBe(true);
    expect(Object.isFrozen(config.steps)).toBe(true);
    expect(Object.isFrozen(config.steps[0])).toBe(true);
  });

  it("does not freeze DOM elements or callbacks", () => {
    const element = document.createElement("button");
    const callback = () => {};
    const config = normalizeConfig({
      ...base,
      steps: [{ title: "t", target: { element } }],
      on: { complete: callback },
    });

    expect(Object.isFrozen(element)).toBe(false);
    expect(Object.isFrozen(callback)).toBe(false);
    // The configuration itself is still frozen, and still references them.
    expect(Object.isFrozen(config)).toBe(true);
    expect(config.steps[0].target.element).toBe(element);
    expect(config.on.complete).toBe(callback);
  });

  it("merges nested objects but replaces arrays", () => {
    const merged = mergeConfig(
      { labels: { next: "Next", previous: "Back" }, steps: [1, 2] },
      { labels: { next: "Onwards" }, steps: [3] }
    );

    expect(merged.labels).toEqual({ next: "Onwards", previous: "Back" });
    expect(merged.steps).toEqual([3]);
  });

  it("cloneConfig preserves function references", () => {
    const fn = () => {};
    const cloned = cloneConfig({ fn, nested: { fn } });
    expect(cloned.fn).toBe(fn);
    expect(cloned.nested.fn).toBe(fn);
  });

  it("survives circular configuration without hanging", () => {
    const config = { ...base };
    config.self = config;
    expect(() => cloneConfig(config)).not.toThrow();
  });
});

describe("configuration precedence", () => {
  it("resolves option as step → tour → default", async () => {
    const { resolveOption } = await import("../../src/configuration/normalize.js");
    const config = normalizeConfig({ ...base, placement: "top" });

    expect(resolveOption(config, { placement: "left" }, "placement")).toBe("left");
    expect(resolveOption(config, {}, "placement")).toBe("top");
    expect(resolveOption(config, undefined, "placement")).toBe("top");
  });
});
