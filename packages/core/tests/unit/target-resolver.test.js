import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  findElementsBySelector,
  findElementsByTargetId,
  isTargetUsable,
  resolveTargetElement,
} from "../../src/targets/resolver.js";
import { normalizeConfig } from "../../src/configuration/normalize.js";
import { TargetError } from "../../src/errors/index.js";

const CONFIG = normalizeConfig({
  tourId: "resolver",
  steps: [{ tourId: "home.cta", title: "t" }],
});

function tag(id) {
  const el = document.createElement("button");
  el.setAttribute("data-tour-id", id);
  el.textContent = id;
  document.body.append(el);
  return el;
}

describe("target resolution", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("resolves a simple identifier", () => {
    const el = tag("home.cta");
    expect(findElementsByTargetId("home.cta")).toEqual([el]);
  });

  it("treats dots as data, not as selector syntax", () => {
    tag("home.cta");
    tag("home.sidebar");

    expect(findElementsByTargetId("home.cta")).toHaveLength(1);
    expect(findElementsByTargetId("home.sidebar")).toHaveLength(1);
    expect(findElementsByTargetId("home")).toHaveLength(0);
    expect(findElementsByTargetId("cta")).toHaveLength(0);
  });

  it("matches identifiers exactly rather than as substrings", () => {
    tag("home.cta");
    tag("home.cta.extra");
    tag("my.home.cta");

    expect(findElementsByTargetId("home.cta")).toHaveLength(1);
  });

  it("handles identifiers containing CSS-significant characters", () => {
    const tricky = ['a"b', "a'b", "a\\b", "100%", "[data-x]", "a:b", "*", "#hash", "a{b}"];

    for (const id of tricky) tag(id);

    for (const id of tricky) {
      expect(findElementsByTargetId(id)).toHaveLength(1);
    }
  });

  it("matches identifiers with unicode and whitespace", () => {
    tag("  padded  ");
    tag("nav.primary");

    expect(findElementsByTargetId("  padded  ")).toHaveLength(1);
    expect(findElementsByTargetId("nav.primary")).toHaveLength(1);
  });

  it("returns an empty list for an empty or non-string identifier", () => {
    expect(findElementsByTargetId("")).toEqual([]);
    expect(findElementsByTargetId(undefined)).toEqual([]);
    expect(findElementsByTargetId(null)).toEqual([]);
  });

  it("reports ambiguity instead of silently taking the first match", () => {
    tag("dup");
    tag("dup");

    expect(() => resolveTargetElement({ tourId: "dup" }, CONFIG)).toThrowError(TargetError);

    try {
      resolveTargetElement({ tourId: "dup" }, CONFIG);
    } catch (error) {
      expect(error.reason).toBe("ambiguous");
      expect(error.matches).toHaveLength(2);
      expect(error.message).toMatch(/matches 2 elements/);
      expect(error.message).toMatch(/target.occurrence/);
    }
  });

  it("honours an explicit `occurrence: 'first'` opt-in", () => {
    const first = tag("dup");
    tag("dup");

    const result = resolveTargetElement({ tourId: "dup", target: { occurrence: "first" } }, CONFIG);
    expect(result.element).toBe(first);
    expect(result.reason).toBe("resolved");
  });

  it("honours an explicit numeric occurrence", () => {
    tag("dup");
    const second = tag("dup");

    const result = resolveTargetElement({ tourId: "dup", target: { occurrence: 1 } }, CONFIG);
    expect(result.element).toBe(second);
  });

  it("reports an out-of-range occurrence index", () => {
    tag("dup");
    tag("dup");

    expect(() =>
      resolveTargetElement({ tourId: "dup", target: { occurrence: 5 } }, CONFIG)
    ).toThrowError(/out of range/);
  });

  it("reports a missing target", () => {
    const result = resolveTargetElement({ tourId: "nope" }, CONFIG);
    expect(result.element).toBeNull();
    expect(result.reason).toBe("missing");
  });

  it("ignores detached elements", () => {
    const el = tag("gone");
    el.remove();

    const result = resolveTargetElement({ tourId: "gone" }, CONFIG);
    expect(result.element).toBeNull();
    expect(result.reason).toBe("missing");
  });

  it("treats a display:none element as hidden rather than missing", () => {
    const el = tag("hidden.thing");
    el.style.display = "none";

    expect(isTargetUsable(el)).toBe(false);
    // The element is still found; usability is a separate question.
    expect(resolveTargetElement({ tourId: "hidden.thing" }, CONFIG).element).toBe(el);
  });

  it("treats an element hidden by an ancestor as hidden", () => {
    const parent = document.createElement("div");
    parent.style.display = "none";
    const child = document.createElement("button");
    child.setAttribute("data-tour-id", "child");
    parent.append(child);
    document.body.append(parent);

    expect(isTargetUsable(child)).toBe(false);
  });

  it("treats a visibility:hidden element as hidden", () => {
    const el = tag("invisible");
    el.style.visibility = "hidden";
    expect(isTargetUsable(el)).toBe(false);
  });

  it("resolves an explicit element target", () => {
    const el = document.createElement("div");
    document.body.append(el);

    expect(resolveTargetElement({ target: { element: el } }, CONFIG).element).toBe(el);
  });

  it("reports a detached explicit element target", () => {
    const el = document.createElement("div");
    expect(resolveTargetElement({ target: { element: el } }, CONFIG).reason).toBe("detached");
  });

  it("resolves a selector target", () => {
    const el = document.createElement("div");
    el.id = "main";
    document.body.append(el);

    expect(findElementsBySelector("#main")).toEqual([el]);
    expect(resolveTargetElement({ target: { selector: "#main" } }, CONFIG).element).toBe(el);
  });

  it("reports an invalid selector as an actionable error", () => {
    try {
      findElementsBySelector("div[");
      expect.unreachable("expected a TargetError");
    } catch (error) {
      expect(error).toBeInstanceOf(TargetError);
      expect(error.reason).toBe("invalid-selector");
      expect(error.message).toMatch(/Invalid CSS selector/);
    }
  });

  it("reports ambiguity for a selector that matches several elements", () => {
    for (let i = 0; i < 2; i += 1) {
      const div = document.createElement("div");
      div.className = "row";
      document.body.append(div);
    }

    expect(() => resolveTargetElement({ target: { selector: ".row" } }, CONFIG)).toThrowError(
      /matches 2 elements/
    );
  });

  it("reports a centred step as having no target", () => {
    expect(resolveTargetElement({ title: "Welcome", centered: true }, CONFIG)).toEqual({
      element: null,
      reason: "centred",
      matches: [],
    });
  });

  it("only searches inside the provided root", () => {
    const scope = document.createElement("section");
    document.body.append(scope);

    const inner = document.createElement("button");
    inner.setAttribute("data-tour-id", "scoped");
    scope.append(inner);

    expect(findElementsByTargetId("scoped", scope)).toEqual([inner]);
  });
});
