import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { reducer, useToast, toast } from "./use-toast";

interface ToastState {
  toasts: Array<{ id: string; open?: boolean; title?: unknown }>;
}

describe("toast reducer (pure)", () => {
  const empty: ToastState = { toasts: [] };

  describe("ADD_TOAST", () => {
    it("adds a toast at the front", () => {
      const next = reducer(empty, {
        type: "ADD_TOAST",
        toast: { id: "1", open: true },
      });
      expect(next.toasts).toEqual([{ id: "1", open: true }]);
    });

    it("respects TOAST_LIMIT = 1 (newer replaces older)", () => {
      const after1 = reducer(empty, {
        type: "ADD_TOAST",
        toast: { id: "1", open: true, title: "first" },
      });
      const after2 = reducer(after1, {
        type: "ADD_TOAST",
        toast: { id: "2", open: true, title: "second" },
      });
      expect(after2.toasts).toHaveLength(1);
      expect(after2.toasts[0].id).toBe("2");
    });
  });

  describe("UPDATE_TOAST", () => {
    it("merges fields by id and leaves other toasts unchanged", () => {
      const state: ToastState = { toasts: [{ id: "1", open: true, title: "old" }] };
      const next = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", title: "new" },
      });
      expect(next.toasts[0].title).toBe("new");
      expect(next.toasts[0].open).toBe(true);
    });

    it("is a no-op when id does not match", () => {
      const state: ToastState = { toasts: [{ id: "1", open: true }] };
      const next = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "missing", title: "x" },
      });
      expect(next.toasts).toEqual(state.toasts);
    });
  });

  describe("DISMISS_TOAST", () => {
    it("sets open=false on the matching toast", () => {
      const state: ToastState = {
        toasts: [{ id: "1", open: true }, { id: "2", open: true }],
      };
      const next = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });
      expect(next.toasts[0].open).toBe(false);
      expect(next.toasts[1].open).toBe(true);
    });

    it("with undefined id, dismisses all toasts", () => {
      const state: ToastState = {
        toasts: [{ id: "1", open: true }, { id: "2", open: true }],
      };
      const next = reducer(state, { type: "DISMISS_TOAST" });
      expect(next.toasts.every((t) => t.open === false)).toBe(true);
    });
  });

  describe("REMOVE_TOAST", () => {
    it("removes the matching toast", () => {
      const state: ToastState = { toasts: [{ id: "1" }, { id: "2" }] };
      const next = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });
      expect(next.toasts.map((t) => t.id)).toEqual(["2"]);
    });

    it("with undefined id, clears all toasts", () => {
      const state: ToastState = { toasts: [{ id: "1" }, { id: "2" }] };
      const next = reducer(state, { type: "REMOVE_TOAST" });
      expect(next.toasts).toEqual([]);
    });
  });
});

/**
 * The hook keeps module-level state (memoryState, listeners, genId counter).
 * We can't reset that without re-importing the module, so each test asserts
 * on properties of the toast it just created (matching by id), not on the
 * absolute length of result.current.toasts. TOAST_LIMIT = 1 means at most
 * one toast is visible at any time, which makes single-toast assertions
 * deterministic regardless of prior tests.
 */
describe("useToast hook", () => {
  it("exposes toast(), dismiss() and a toasts array", () => {
    const { result } = renderHook(() => useToast());
    expect(result.current).toMatchObject({
      toast: expect.any(Function),
      dismiss: expect.any(Function),
      toasts: expect.any(Array),
    });
  });

  it("toast() returns id/dismiss/update", () => {
    const { result } = renderHook(() => useToast());
    let api: ReturnType<typeof toast> | null = null;
    act(() => {
      api = result.current.toast({ title: "Hello" });
    });
    expect(api).not.toBeNull();
    expect(api!.id).toEqual(expect.any(String));
    expect(typeof api!.dismiss).toBe("function");
    expect(typeof api!.update).toBe("function");
  });

  it("toast() makes the new toast visible (open: true) and accessible by id", () => {
    const { result } = renderHook(() => useToast());
    let api: ReturnType<typeof toast> | null = null;
    act(() => {
      api = result.current.toast({ title: "Hello" });
    });
    const visible = result.current.toasts.find((t) => t.id === api!.id);
    expect(visible?.open).toBe(true);
  });

  it("the returned dismiss() flips open=false on that specific toast", () => {
    const { result } = renderHook(() => useToast());
    let api: ReturnType<typeof toast> | null = null;
    act(() => {
      api = result.current.toast({ title: "Hello" });
    });
    act(() => api!.dismiss());
    const toastNow = result.current.toasts.find((t) => t.id === api!.id);
    // After dismiss the toast is either marked closed or removed by a flush.
    if (toastNow) {
      expect(toastNow.open).toBe(false);
    } else {
      expect(toastNow).toBeUndefined();
    }
  });

  it("the returned update() merges new fields onto the same toast id", () => {
    const { result } = renderHook(() => useToast());
    let api: ReturnType<typeof toast> | null = null;
    act(() => {
      api = result.current.toast({ title: "First" });
    });
    act(() => api!.update({ id: api!.id, title: "Second" }));
    const updated = result.current.toasts.find((t) => t.id === api!.id);
    expect(updated?.title).toBe("Second");
  });

  it("subsequent toast() calls respect TOAST_LIMIT = 1 (only the latest is kept)", () => {
    const { result } = renderHook(() => useToast());
    let aId = "";
    let bId = "";
    act(() => {
      aId = result.current.toast({ title: "A" }).id;
    });
    act(() => {
      bId = result.current.toast({ title: "B" }).id;
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].id).toBe(bId);
    expect(aId).not.toBe(bId);
  });

  it("TOAST_REMOVE_DELAY drains dismissed toasts when timers advance", () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useToast());
      let api: ReturnType<typeof toast> | null = null;
      act(() => {
        api = result.current.toast({ title: "Hello" });
      });
      act(() => api!.dismiss());
      // The remove queue is gated on a 1,000,000 ms timer in the hook.
      act(() => {
        vi.advanceTimersByTime(1_000_001);
      });
      // After the timer fires, the toast we just created is gone.
      const stillThere = result.current.toasts.find((t) => t.id === api!.id);
      expect(stillThere).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });
});
