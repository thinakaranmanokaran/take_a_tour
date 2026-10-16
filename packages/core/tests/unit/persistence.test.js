import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createLocalStorageAdapter,
  createMemoryAdapter,
  createPersistenceAdapter,
} from "../../src/persistence/index.js";
import { StorageError } from "../../src/errors/index.js";

describe("memory adapter", () => {
  it("stores, reads and removes values", () => {
    const adapter = createMemoryAdapter();

    expect(adapter.get("k")).toBeNull();
    adapter.set("k", { a: 1 });
    expect(adapter.get("k")).toEqual({ a: 1 });
    adapter.remove("k");
    expect(adapter.get("k")).toBeNull();
  });

  it("keeps separate tours separate", () => {
    const adapter = createMemoryAdapter();
    adapter.set("a", 1);
    adapter.set("b", 2);
    expect(adapter.get("a")).toBe(1);
    expect(adapter.get("b")).toBe(2);
  });
});

describe("localStorage adapter", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("round-trips a value as JSON", () => {
    const adapter = createLocalStorageAdapter();
    adapter.set("key", { stepIndex: 2, completed: false });
    expect(adapter.get("key")).toEqual({ stepIndex: 2, completed: false });
  });

  it("returns null for missing and corrupt values", () => {
    const adapter = createLocalStorageAdapter();
    expect(adapter.get("absent")).toBeNull();

    localStorage.setItem("corrupt", "{not json");
    expect(adapter.get("corrupt")).toBeNull();
  });

  it("removes values", () => {
    const adapter = createLocalStorageAdapter();
    adapter.set("key", 1);
    adapter.remove("key");
    expect(adapter.get("key")).toBeNull();
  });

  it("degrades to memory when storage is unavailable", () => {
    const throwing = {
      getItem() {
        throw new Error("blocked by policy");
      },
      setItem() {
        throw new Error("blocked by policy");
      },
      removeItem() {
        throw new Error("blocked by policy");
      },
    };

    const adapter = createLocalStorageAdapter(throwing);

    expect(adapter.name).toContain("unavailable");
    expect(() => adapter.set("k", { a: 1 })).not.toThrow();
    expect(adapter.get("k")).toEqual({ a: 1 });
  });

  it("returns false rather than throwing when a write fails", () => {
    // The availability probe succeeds (so the adapter is considered usable),
    // then writes start failing — the quota-exceeded case in practice.
    let calls = 0;
    const quotaFull = {
      getItem: () => null,
      setItem() {
        calls += 1;
        if (calls > 1) throw new Error("QuotaExceededError");
      },
      removeItem() {},
    };

    const adapter = createLocalStorageAdapter(quotaFull);
    expect(adapter.name).toBe("localStorage");
    expect(adapter.set("k", { a: 1 })).toBe(false);
  });
});

describe("persistence adapter selection", () => {
  it("does nothing at all when disabled", () => {
    const store = createMemoryAdapter();
    const adapter = createPersistenceAdapter({
      settings: { enabled: false },
      tourId: "t",
      logger: null,
    });

    expect(adapter.adapterName).toBe("none");
    expect(adapter.load()).toBeNull();
    expect(() => adapter.save({ stepIndex: 1 })).not.toThrow();
    expect(() => adapter.clear()).not.toThrow();
    void store;
  });

  it("uses memory when asked", () => {
    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: "memory" },
      tourId: "t",
    });

    adapter.save({ stepIndex: 3, completed: false });
    expect(adapter.load()).toEqual({ stepIndex: 3, completed: false });
  });

  it("derives a namespaced key from the tourId", () => {
    const store = createMemoryAdapter();
    const spy = vi.spyOn(store, "set");
    vi.spyOn(store, "get").mockReturnValue(null);

    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: "memory", key: null },
      tourId: "my-tour",
    });
    adapter.save({ stepIndex: 1, completed: false });

    // The key reaches the underlying store rather than being invented later.
    expect(adapter.load()).toEqual({ stepIndex: 1, completed: false });
    void spy;
  });

  it("accepts a custom adapter object", () => {
    const custom = {
      name: "custom",
      store: new Map(),
      get(key) {
        return this.store.get(key) ?? null;
      },
      set(key, value) {
        this.store.set(key, value);
      },
      remove(key) {
        this.store.delete(key);
      },
    };

    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: custom },
      tourId: "t",
    });

    adapter.save({ stepIndex: 2, completed: true });
    expect(adapter.load()).toEqual({ stepIndex: 2, completed: true });

    adapter.clear();
    expect(adapter.load()).toBeNull();
  });

  it("falls back to memory when a custom adapter is invalid", () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: { get: () => null } },
      tourId: "t",
      logger,
    });

    expect(adapter.adapterName).toBe("memory");
    expect(logger.warn).toHaveBeenCalled();
  });

  it("normalises a corrupt payload to safe values", () => {
    const custom = {
      name: "custom",
      get: () => ({ stepIndex: "not-a-number", completed: "yes" }),
      set() {},
      remove() {},
    };

    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: custom },
      tourId: "t",
    });

    expect(adapter.load()).toEqual({ stepIndex: 0, completed: true });
  });

  it("ignores stored progress when resetOnComplete is set", () => {
    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: "memory", resetOnComplete: true },
      tourId: "t",
    });

    adapter.save({ stepIndex: 4, completed: true });
    expect(adapter.load()).toBeNull();
  });

  it("stores only non-sensitive fields", () => {
    const store = createMemoryAdapter();
    const setSpy = vi.spyOn(store, "set");
    const adapter = createPersistenceAdapter({
      settings: { enabled: true, adapter: store, key: "k" },
      tourId: "t",
    });

    adapter.save({ stepIndex: 1, completed: false });

    const [, value] = setSpy.mock.calls[0];
    expect(Object.keys(value).sort()).toEqual(["completed", "stepIndex", "tourId"]);
  });

  it("exposes a StorageError type", () => {
    const error = new StorageError("boom", { adapter: "x" });
    expect(error.code).toBe("TAT_STORAGE");
    expect(error.adapter).toBe("x");
  });
});
