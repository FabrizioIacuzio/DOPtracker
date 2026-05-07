import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { AppDataProvider, useAppData } from "./AppDataContext";
import { makeBatch, makeCompany, makeLabReport } from "@/test/fixtures";
import { freezeTime } from "@/test/fakes";

const wrap = ({ children }: { children: React.ReactNode }) => (
  <AppDataProvider>{children}</AppDataProvider>
);

describe("useAppData (state + persistence)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("throws if used outside the provider", () => {
    // Suppress React's expected console.error in this assertion
    const original = console.error;
    console.error = () => {};
    try {
      expect(() => renderHook(() => useAppData())).toThrow(
        "useAppData must be used within AppDataProvider",
      );
    } finally {
      console.error = original;
    }
  });

  it("starts empty when localStorage is empty", () => {
    const { result } = renderHook(() => useAppData(), { wrapper: wrap });
    expect(result.current.companyInfo).toBeNull();
    expect(result.current.batches).toEqual([]);
    expect(result.current.labReports).toEqual([]);
    expect(result.current.onboardingComplete).toBe(false);
  });

  it("rehydrates from localStorage on mount", () => {
    localStorage.setItem("dop_company", JSON.stringify(makeCompany()));
    localStorage.setItem("dop_batches", JSON.stringify([makeBatch()]));
    localStorage.setItem("dop_labReports", JSON.stringify([makeLabReport()]));
    localStorage.setItem("dop_onboarded", JSON.stringify(true));
    const { result } = renderHook(() => useAppData(), { wrapper: wrap });
    expect(result.current.companyInfo?.name).toBe("Acetaia Test S.r.l.");
    expect(result.current.batches).toHaveLength(1);
    expect(result.current.labReports).toHaveLength(1);
    expect(result.current.onboardingComplete).toBe(true);
  });

  it("falls back to defaults when localStorage value is malformed JSON", () => {
    localStorage.setItem("dop_batches", "{not-json");
    const { result } = renderHook(() => useAppData(), { wrapper: wrap });
    expect(result.current.batches).toEqual([]);
  });

  it("setCompanyInfo persists to localStorage", () => {
    const { result } = renderHook(() => useAppData(), { wrapper: wrap });
    act(() => {
      result.current.setCompanyInfo(makeCompany({ name: "New Co" }));
    });
    expect(JSON.parse(localStorage.getItem("dop_company") ?? "null")).toMatchObject({
      name: "New Co",
    });
  });

  it("setOnboardingComplete persists to localStorage", () => {
    const { result } = renderHook(() => useAppData(), { wrapper: wrap });
    act(() => result.current.setOnboardingComplete(true));
    expect(JSON.parse(localStorage.getItem("dop_onboarded") ?? "null")).toBe(true);
  });

  describe("addBatch", () => {
    it("appends a batch and persists the array", () => {
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.addBatch(makeBatch()));
      expect(result.current.batches).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem("dop_batches") ?? "[]")).toHaveLength(1);
    });

    it("appends in call order", () => {
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.addBatch(makeBatch({ id: "a" })));
      act(() => result.current.addBatch(makeBatch({ id: "b" })));
      expect(result.current.batches.map((b) => b.id)).toEqual(["a", "b"]);
    });
  });

  describe("updateBatch", () => {
    it("merges the partial onto the matching batch", () => {
      localStorage.setItem(
        "dop_batches",
        JSON.stringify([makeBatch({ id: "x", supplier: "Old" })]),
      );
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.updateBatch("x", { supplier: "New" }));
      expect(result.current.batches[0].supplier).toBe("New");
    });

    it("sets modifiedAt to the current ISO timestamp", () => {
      freezeTime("2026-06-01T08:30:00.000Z");
      localStorage.setItem("dop_batches", JSON.stringify([makeBatch({ id: "x" })]));
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.updateBatch("x", { volume: 999 }));
      expect(result.current.batches[0].modifiedAt).toBe("2026-06-01T08:30:00.000Z");
    });

    it("leaves other batches untouched", () => {
      localStorage.setItem(
        "dop_batches",
        JSON.stringify([makeBatch({ id: "a", supplier: "A" }), makeBatch({ id: "b", supplier: "B" })]),
      );
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.updateBatch("a", { supplier: "AA" }));
      expect(result.current.batches.find((b) => b.id === "b")?.supplier).toBe("B");
    });

    it("is a no-op when no batch matches the id", () => {
      localStorage.setItem("dop_batches", JSON.stringify([makeBatch({ id: "x" })]));
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.updateBatch("does-not-exist", { supplier: "X" }));
      expect(result.current.batches[0].id).toBe("x");
      expect(result.current.batches[0].modifiedAt).toBeUndefined();
    });
  });

  describe("getBatchesByDate", () => {
    it("returns only batches for the requested ISO date", () => {
      localStorage.setItem(
        "dop_batches",
        JSON.stringify([
          makeBatch({ id: "a", date: "2026-05-01" }),
          makeBatch({ id: "b", date: "2026-05-02" }),
          makeBatch({ id: "c", date: "2026-05-01" }),
        ]),
      );
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      const may1 = result.current.getBatchesByDate("2026-05-01");
      expect(may1.map((b) => b.id).sort()).toEqual(["a", "c"]);
    });

    it("returns an empty array for a date with no batches", () => {
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      expect(result.current.getBatchesByDate("1999-01-01")).toEqual([]);
    });
  });

  describe("addLabReport", () => {
    it("appends a lab report and persists", () => {
      const { result } = renderHook(() => useAppData(), { wrapper: wrap });
      act(() => result.current.addLabReport(makeLabReport()));
      expect(result.current.labReports).toHaveLength(1);
      expect(JSON.parse(localStorage.getItem("dop_labReports") ?? "[]")).toHaveLength(1);
    });
  });
});
