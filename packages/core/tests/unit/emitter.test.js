import { describe, expect, it, vi } from "vitest";
import { createEmitter } from "../../src/utilities/emitter.js";

describe("event emitter", () => {
  it("invokes listeners in registration order", () => {
    const emitter = createEmitter();
    const order = [];

    emitter.on("x", () => order.push(1));
    emitter.on("x", () => order.push(2));
    emitter.emit("x", {});
    emitter.emit("x", {});

    expect(order).toEqual([1, 2, 1, 2]);
  });

  it("passes the payload to every listener", () => {
    const emitter = createEmitter();
    const a = vi.fn();
    const b = vi.fn();

    emitter.on("x", a);
    emitter.on("x", b);
    emitter.emit("x", { value: 42 });

    expect(a).toHaveBeenCalledWith({ value: 42 });
    expect(b).toHaveBeenCalledWith({ value: 42 });
  });

  it("returns a working unsubscribe function", () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    const off = emitter.on("x", handler);
    emitter.emit("x", {});
    off();
    emitter.emit("x", {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("removes only the requested listener", () => {
    const emitter = createEmitter();
    const kept = vi.fn();
    const removed = vi.fn();

    emitter.on("x", kept);
    emitter.on("x", removed);
    emitter.off("x", removed);
    emitter.emit("x", {});

    expect(kept).toHaveBeenCalledOnce();
    expect(removed).not.toHaveBeenCalled();
  });

  it("supports once()", () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    emitter.once("x", handler);
    emitter.emit("x", {});
    emitter.emit("x", {});

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("returns an unsubscribe function from once()", () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    const off = emitter.once("x", handler);
    off();
    emitter.emit("x", {});

    expect(handler).not.toHaveBeenCalled();
  });

  it("isolates a throwing listener so the others still run", async () => {
    const onError = vi.fn();
    const emitter = createEmitter({ onError });
    const after = vi.fn();

    emitter.on("x", () => {
      throw new Error("listener exploded");
    });
    emitter.on("x", after);

    await emitter.emit("x", {});

    expect(after).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe("listener exploded");
    expect(onError.mock.calls[0][1]).toEqual({ event: "x" });
  });

  it("isolates a rejecting async listener", async () => {
    const onError = vi.fn();
    const emitter = createEmitter({ onError });
    const after = vi.fn();

    emitter.on("x", async () => {
      throw new Error("async explosion");
    });
    emitter.on("x", after);

    await emitter.emit("x", {});

    expect(after).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("waits for async listeners before reporting errors", async () => {
    const onError = vi.fn();
    const emitter = createEmitter({ onError });

    emitter.on("x", async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      throw new Error("late failure");
    });

    await emitter.emit("x", {});

    expect(onError).toHaveBeenCalledOnce();
  });

  it("survives an error reporter that itself throws", async () => {
    const emitter = createEmitter({
      onError: () => {
        throw new Error("reporter exploded");
      },
    });

    emitter.on("x", () => {
      throw new Error("original");
    });

    await expect(emitter.emit("x", {})).resolves.toBeDefined();
  });

  it("tolerates a listener unsubscribing during dispatch", async () => {
    const emitter = createEmitter();
    const second = vi.fn();
    const offSecond = emitter.on("x", second);

    emitter.on("x", () => offSecond());
    await emitter.emit("x", {});

    // The snapshot was taken before dispatch, so `second` still ran once.
    expect(second).toHaveBeenCalledOnce();
    await emitter.emit("x", {});
    expect(second).toHaveBeenCalledOnce();
  });

  it("reports how many listeners an event has", () => {
    const emitter = createEmitter();
    emitter.on("x", () => {});
    emitter.on("x", () => {});

    expect(emitter.listenerCount("x")).toBe(2);
    emitter.off("x", () => {});
    expect(emitter.listenerCount("x")).toBe(2);
  });

  it("clears one event or all events", () => {
    const emitter = createEmitter();
    emitter.on("a", () => {});
    emitter.on("b", () => {});

    emitter.clear("a");
    expect(emitter.listenerCount("a")).toBe(0);
    expect(emitter.listenerCount("b")).toBe(1);

    emitter.clear();
    expect(emitter.listenerCount("b")).toBe(0);
  });

  it("rejects a non-function listener", () => {
    const emitter = createEmitter();
    expect(() => emitter.on("x", "nope")).toThrowError(/must be a function/);
    expect(() => emitter.once("x", null)).toThrowError(/must be a function/);
  });

  it("stops dispatching and drops listeners after destroy", async () => {
    const emitter = createEmitter();
    const handler = vi.fn();

    emitter.on("x", handler);
    emitter.destroy();

    await emitter.emit("x", {});

    expect(handler).not.toHaveBeenCalled();
    expect(emitter.listenerCount("x")).toBe(0);
    expect(emitter.destroyed).toBe(true);
  });

  it("returns a no-op unsubscribe after destroy", () => {
    const emitter = createEmitter();
    emitter.destroy();
    const off = emitter.on("x", () => {});
    expect(() => off()).not.toThrow();
  });

  it("resolves immediately when nothing is listening", async () => {
    const emitter = createEmitter();
    await expect(emitter.emit("nobody-is-listening", {})).resolves.toEqual([]);
  });
});
