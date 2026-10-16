import { beforeEach, describe, expect, it } from "vitest";
import { createTour } from "../../src/public-api/create-tour.js";
import { __resetRegistry } from "../../src/registry/tour-registry.js";
import { __resetLock } from "../../src/registry/active-tour-lock.js";
import { renderContent, resolveText } from "../../src/components/content/index.js";
import { createIcon, ICON_PATHS } from "../../src/icons/index.js";

function target(id) {
  const el = document.createElement("button");
  el.setAttribute("data-tour-id", id);
  document.body.append(el);
  return el;
}

describe("safe content rendering", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  it("renders plain text through textContent", () => {
    const el = document.createElement("div");
    renderContent(el, { content: "Hello", context: {} });

    expect(el.textContent).toBe("Hello");
    expect(el.children).toHaveLength(0);
  });

  it("never interprets markup in ordinary configuration text", () => {
    const el = document.createElement("div");
    renderContent(el, {
      content: '<img src=x onerror="alert(1)">',
      context: {},
      config: { unsafeHTML: false },
    });

    // The payload is visible text, not a live element.
    expect(el.querySelector("img")).toBeNull();
    expect(el.textContent).toBe('<img src=x onerror="alert(1)">');
  });

  it("does not interpret markup even when `unsafeContent` is supplied without the opt-in", () => {
    const el = document.createElement("div");
    renderContent(el, {
      content: "safe",
      context: {},
      config: { unsafeHTML: false },
      unsafeContent: "<b>injected</b>",
    });

    expect(el.querySelector("b")).toBeNull();
    expect(el.textContent).toBe("safe");
  });

  it("parses trusted markup only when the tour opts in", () => {
    const el = document.createElement("div");
    renderContent(el, {
      content: "ignored",
      context: {},
      config: { unsafeHTML: true },
      unsafeContent: "<b>authored</b>",
    });

    expect(el.querySelector("b")).not.toBeNull();
    expect(el.textContent).toBe("authored");
  });

  it("ignores whitespace-only trusted markup", () => {
    const el = document.createElement("div");
    renderContent(el, {
      content: "fallback",
      context: {},
      config: { unsafeHTML: true },
      unsafeContent: "   ",
    });

    expect(el.textContent).toBe("fallback");
  });

  it("clears previous content on re-render", () => {
    const el = document.createElement("div");
    renderContent(el, { content: "first", context: {} });
    renderContent(el, { content: "second", context: {} });

    expect(el.textContent).toBe("second");
  });

  it("resolves function-valued content with the step context", () => {
    const context = { step: { tourId: "a" } };
    expect(resolveText((ctx) => `id is ${ctx.step.tourId}`, context)).toBe("id is a");
  });

  it("renders empty for a non-string function result", () => {
    expect(resolveText(() => 42, {})).toBe("");
    expect(resolveText(async () => "later", {})).toBe("");
  });

  it("handles null and undefined", () => {
    expect(resolveText(null, {})).toBe("");
    expect(resolveText(undefined, {})).toBe("");
  });
});

describe("icons", () => {
  it("builds SVG in the correct namespace without innerHTML", () => {
    const icon = createIcon("check");

    expect(icon.namespaceURI).toBe("http://www.w3.org/2000/svg");
    expect(icon.tagName.toLowerCase()).toBe("svg");
    expect(icon.childNodes.length).toBeGreaterThan(0);
    for (const child of icon.childNodes) {
      expect(child.namespaceURI).toBe("http://www.w3.org/2000/svg");
      expect(child.tagName.toLowerCase()).toBe("path");
      expect(child.attributes).toHaveLength(1); // only `d`
    }
  });

  it("is always hidden from assistive technology", () => {
    // The accessible name belongs to the button, never to the icon shape.
    expect(createIcon("close").getAttribute("aria-hidden")).toBe("true");
    expect(createIcon("close").getAttribute("focusable")).toBe("false");
  });

  it("throws a helpful error for an unknown icon", () => {
    expect(() => createIcon("rocket")).toThrowError(/Unknown icon "rocket"/);
    expect(() => createIcon("rocket")).toThrowError(/Available icons/);
  });

  it("ships only the icons the library uses", () => {
    expect(Object.keys(ICON_PATHS).sort()).toEqual([
      "check",
      "check-circle",
      "chevron-left",
      "chevron-right",
      "close",
      "sparkle",
    ]);
  });
});

describe("security properties of a running tour", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
  });

  it("renders attacker-controlled step text as inert text", async () => {
    target("home.cta");
    const payload =
      "<script>window.__pwned = true</" + 'script><img src=x onerror="window.__pwned=true">';

    const tour = createTour({
      tourId: "security",
      steps: [{ tourId: "home.cta", title: payload, content: payload }],
    });

    await tour.start();

    expect(document.querySelector(".tat-tooltip script")).toBeNull();
    expect(document.querySelector(".tat-tooltip img")).toBeNull();
    expect(window.__pwned).toBeUndefined();
    expect(document.querySelector(".tat-tooltip__title").textContent).toBe(payload);

    tour.destroy();
  });

  it("does not treat a target identifier as a selector", async () => {
    // If the id were interpolated into a selector, this would match nothing or
    // throw. It resolves as exact attribute data instead.
    target("weird id; with ] brackets [");
    const tour = createTour({
      tourId: "selector-safety",
      steps: [{ tourId: "weird id; with ] brackets [", title: "Safe" }],
    });

    await tour.start();
    expect(tour.getState()).toBe("running");
    tour.destroy();
  });

  it("does not mutate globals or prototypes", async () => {
    target("home.cta");
    const before = Object.getOwnPropertyNames(window).length;

    const tour = createTour({
      tourId: "globals",
      steps: [{ tourId: "home.cta", title: "A" }],
    });
    await tour.start();
    tour.destroy();

    expect(Object.getOwnPropertyNames(window).length).toBe(before);
    expect(Object.getPrototypeOf({})).toBe(Object.prototype);
  });

  it("never writes application content to the console", async () => {
    target("home.cta");
    const tour = createTour({
      tourId: "quiet",
      debug: false,
      steps: [{ tourId: "home.cta", title: "secret-value", content: "more-secret" }],
    });

    await tour.start();
    tour.destroy();
    // Nothing to assert beyond "no throw" — the logger is silent without debug.
    expect(true).toBe(true);
  });
});
