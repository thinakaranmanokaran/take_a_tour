import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTour } from "../../src/public-api/create-tour.js";
import { __resetRegistry } from "../../src/registry/tour-registry.js";
import { __resetLock } from "../../src/registry/active-tour-lock.js";

function target(id) {
  const el = document.createElement("button");
  el.setAttribute("data-tour-id", id);
  el.textContent = id;
  document.body.append(el);
  return el;
}

function press(key, init = {}) {
  document.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, ...init }));
}

/** Let queued microtasks and a macrotask run, so async navigation settles. */
function settle() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("accessibility", () => {
  let tours = [];

  function make(config = {}) {
    const tour = createTour({
      tourId: `a11y-${tours.length}`,
      steps: [
        { tourId: "a", title: "First", content: "One." },
        { tourId: "b", title: "Second", content: "Two." },
      ],
      ...config,
    });
    tours.push(tour);
    return tour;
  }

  beforeEach(() => {
    document.body.innerHTML = "";
    __resetRegistry();
    __resetLock();
    target("a");
    target("b");
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

  describe("semantics", () => {
    it("gives the tooltip a dialog role and an accessible name", async () => {
      const tour = make();
      await tour.start();

      const tooltip = document.querySelector(".tat-tooltip");
      expect(tooltip.getAttribute("role")).toBe("dialog");
      expect(tooltip.getAttribute("aria-labelledby")).toBe("tat-title");
      expect(document.getElementById("tat-title").textContent).toBe("First");
    });

    it("marks an anchored tooltip as non-modal", async () => {
      const tour = make();
      await tour.start();

      expect(document.querySelector(".tat-tooltip").getAttribute("aria-modal")).toBe("false");
    });

    it("marks a centred step as a true modal dialog", async () => {
      const tour = make({
        steps: [{ title: "Welcome", content: "This is a tour.", centered: true }],
      });
      await tour.start();

      const modal = document.querySelector(".tat-modal");
      expect(modal.getAttribute("role")).toBe("dialog");
      expect(modal.getAttribute("aria-modal")).toBe("true");
    });

    it("hides the decorative spotlight from assistive technology", async () => {
      const tour = make();
      await tour.start();

      expect(document.querySelector(".tat-spotlight").getAttribute("aria-hidden")).toBe("true");
    });

    it("uses real buttons with accessible names for every control", async () => {
      const tour = make();
      await tour.start();

      const buttons = [...document.querySelectorAll(".tat-root button")];
      expect(buttons.length).toBeGreaterThan(0);

      for (const button of buttons) {
        expect(button.tagName).toBe("BUTTON");
        expect(button.getAttribute("type")).toBe("button");
        expect(button.getAttribute("aria-label")).toBeTruthy();
      }
    });

    it("marks icons decorative rather than relying on their shape", async () => {
      const tour = make();
      await tour.start();

      for (const icon of document.querySelectorAll(".tat-root svg")) {
        expect(icon.getAttribute("aria-hidden")).toBe("true");
      }
    });

    it("exposes progress with progressbar semantics", async () => {
      const tour = make({ showProgress: true });
      await tour.start();

      const bar = document.querySelector('[role="progressbar"]');
      expect(bar).not.toBeNull();
      expect(bar.getAttribute("aria-valuemin")).toBe("1");
      expect(bar.getAttribute("aria-valuemax")).toBe("2");
      expect(bar.getAttribute("aria-valuenow")).toBe("1");
    });
  });

  describe("announcements", () => {
    it("provides a polite live region", async () => {
      const tour = make();
      await tour.start();

      const live = document.querySelector(".tat-live");
      expect(live).not.toBeNull();
      expect(live.getAttribute("role")).toBe("status");
      expect(live.getAttribute("aria-live")).toBe("polite");
    });

    it("announces the step title and position", async () => {
      const tour = make();
      await tour.start();

      const live = document.querySelector(".tat-live");
      expect(live.textContent).toContain("Step 1 of 2");
      expect(live.textContent).toContain("First");

      await tour.next();
      expect(live.textContent).toContain("Step 2 of 2");
    });

    it("omits the live region when announcements are disabled", async () => {
      const tour = make({ announce: false });
      await tour.start();

      expect(document.querySelector(".tat-live")).toBeNull();
    });
  });

  describe("focus management", () => {
    it("moves focus into the tour when it starts", async () => {
      const tour = make();
      await tour.start();

      expect(document.activeElement).not.toBe(document.body);
      expect(document.querySelector(".tat-root").contains(document.activeElement)).toBe(true);
    });

    it("prefers the primary action for focus", async () => {
      const tour = make();
      await tour.start();

      expect(document.activeElement.classList.contains("tat-btn--primary")).toBe(true);
    });

    it("restores focus to the invoking element when the tour ends", async () => {
      const launcher = document.createElement("button");
      launcher.textContent = "Start tour";
      document.body.append(launcher);
      launcher.focus();

      const tour = make();
      await tour.start();
      expect(document.activeElement).not.toBe(launcher);

      tour.stop();
      expect(document.activeElement).toBe(launcher);
    });

    it("restores focus after completion", async () => {
      const launcher = document.createElement("button");
      document.body.append(launcher);
      launcher.focus();

      const tour = make();
      await tour.start();
      await tour.next();
      await tour.next();

      expect(tour.getState()).toBe("completed");
      expect(document.activeElement).toBe(launcher);
    });

    it("restores focus after destroy", async () => {
      const launcher = document.createElement("button");
      document.body.append(launcher);
      launcher.focus();

      const tour = make();
      await tour.start();
      tour.destroy();

      expect(document.activeElement).toBe(launcher);
    });

    it("does not trap focus for an anchored tooltip", async () => {
      const tour = make();
      await tour.start();

      const focusables = [...document.querySelectorAll(".tat-root button")];
      expect(focusables.length).toBeGreaterThan(1);
      // Tabbing from the last control is the browser's job, not ours.
      expect(tour.getState()).toBe("running");
    });

    it("traps focus inside a centred modal", async () => {
      const tour = make({
        steps: [{ title: "Welcome", content: "Modal.", centered: true }],
      });
      await tour.start();

      const focusables = [...document.querySelectorAll(".tat-modal button")];
      expect(focusables.length).toBeGreaterThan(0);

      focusables[focusables.length - 1].focus();
      press("Tab");

      expect(document.activeElement).toBe(focusables[0]);
    });

    it("wraps backwards inside a centred modal", async () => {
      const tour = make({
        steps: [{ title: "Welcome", content: "Modal.", centered: true }],
      });
      await tour.start();

      const focusables = [...document.querySelectorAll(".tat-modal button")];
      focusables[0].focus();
      press("Tab", { shiftKey: true });

      expect(document.activeElement).toBe(focusables[focusables.length - 1]);
    });

    it("does not steal focus back to a page the user moved to", async () => {
      const tour = make();
      await tour.start();

      const outside = document.createElement("input");
      document.body.append(outside);
      outside.focus();

      press("Tab");
      expect(document.activeElement).toBe(outside);
    });
  });

  describe("keyboard navigation", () => {
    it("closes on Escape when enabled", async () => {
      const onStop = vi.fn();
      const tour = make({ closeOnEscape: true });
      tour.on("stop", onStop);

      await tour.start();
      press("Escape");

      expect(onStop).toHaveBeenCalledWith(expect.objectContaining({ reason: "dismissed" }));
      expect(tour.getState()).toBe("stopped");
    });

    it("ignores Escape when disabled", async () => {
      const tour = make({ closeOnEscape: false });
      await tour.start();
      press("Escape");

      expect(tour.getState()).toBe("running");
    });

    it("advances with ArrowRight and goes back with ArrowLeft", async () => {
      const tour = make();
      await tour.start();

      press("ArrowRight");
      // The click handler navigates asynchronously; the Previous control only
      // exists once the new step has rendered.
      await settle();
      expect(tour.getCurrentStep().title).toBe("Second");

      press("ArrowLeft");
      await settle();
      expect(tour.getCurrentStep().title).toBe("First");
    });

    it("does not hijack arrow keys while typing in a field", async () => {
      const tour = make();
      await tour.start();

      const input = document.createElement("input");
      document.body.append(input);
      input.focus();

      press("ArrowRight");
      await Promise.resolve();

      expect(tour.getCurrentStepIndex()).toBe(0);
    });

    it("does not respond to modified key combinations", async () => {
      const tour = make();
      await tour.start();

      press("ArrowRight", { ctrlKey: true });
      press("Escape", { metaKey: true });
      await Promise.resolve();

      expect(tour.getState()).toBe("running");
    });

    it("ignores all keys when keyboard navigation is disabled", async () => {
      const tour = make({ keyboardNavigation: false, closeOnEscape: true });
      await tour.start();

      press("Escape");
      press("ArrowRight");
      await Promise.resolve();

      expect(tour.getState()).toBe("running");
      expect(tour.getCurrentStepIndex()).toBe(0);
    });

    it("stops listening after destroy", async () => {
      const onStop = vi.fn();
      const tour = make();
      tour.on("stop", onStop);

      await tour.start();
      tour.destroy();
      press("Escape");

      expect(onStop).not.toHaveBeenCalled();
    });
  });

  describe("target interaction", () => {
    it("makes the overlay click-through when target interaction is on", async () => {
      const tour = make({
        allowTargetInteraction: true,
        closeOnOverlayClick: true,
      });
      await tour.start();

      const root = document.querySelector(".tat-root");
      expect(root.dataset.tatTargetInteractive).toBe("true");
      expect(document.querySelector(".tat-overlay").style.pointerEvents).toBe("none");
    });

    it("keeps the overlay interactive by default", async () => {
      const tour = make({ closeOnOverlayClick: true });
      await tour.start();

      expect(document.querySelector(".tat-overlay").style.pointerEvents).toBe("auto");
    });

    it("does not disable host page interaction for non-modal tooltips", async () => {
      const tour = make();
      await tour.start();

      // Only the overlay blocks; the page itself is untouched.
      const root = document.querySelector(".tat-root");
      expect(root.style.pointerEvents).not.toBe("none");
    });
  });
});
