import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { LanguageProvider, useLanguage } from "./LanguageContext";

const wrap = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe("useLanguage", () => {
  it("throws when used outside the provider", () => {
    const original = console.error;
    console.error = () => {};
    try {
      expect(() => renderHook(() => useLanguage())).toThrow(
        "useLanguage must be used within LanguageProvider",
      );
    } finally {
      console.error = original;
    }
  });

  it("defaults to Italian", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
    expect(result.current.lang).toBe("it");
  });

  it("toggleLang flips it -> en -> it", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
    act(() => result.current.toggleLang());
    expect(result.current.lang).toBe("en");
    act(() => result.current.toggleLang());
    expect(result.current.lang).toBe("it");
  });

  describe("t() lookup", () => {
    it("returns the Italian string by default", () => {
      const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
      expect(result.current.t("nav.home")).toBe("Home");
      expect(result.current.t("onboarding.welcome.cta")).toBe("Inizia ora");
    });

    it("returns the English string after toggling", () => {
      const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
      act(() => result.current.toggleLang());
      expect(result.current.t("onboarding.welcome.cta")).toBe("Get started");
    });

    it("returns the key itself when the key is not in the dictionary", () => {
      const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
      // Key is unknown — explicit cast because TS would normally reject it.
      const fallback = result.current.t("does.not.exist" as unknown as Parameters<typeof result.current.t>[0]);
      expect(fallback).toBe("does.not.exist");
    });

    it("covers a representative key per category in IT", () => {
      const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
      expect(result.current.t("nav.batch")).toBe("Registra Lotto");
      expect(result.current.t("cat.vinegar")).toBe("Aceto Balsamico IGP");
      expect(result.current.t("batch.acidity")).toBe("Acidità totale (%)");
      expect(result.current.t("calendar.flagged")).toBe("Anomalia");
      expect(result.current.t("dashboard.compliance")).toBe("Tasso di Conformità");
      expect(result.current.t("lab.upload")).toBe("Carica rapporto PDF");
      expect(result.current.t("docs.checklist")).toBe("Checklist di Invio");
    });

    it("covers a representative key per category in EN", () => {
      const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
      act(() => result.current.toggleLang());
      expect(result.current.t("nav.batch")).toBe("Log Batch");
      expect(result.current.t("cat.vinegar")).toBe("Balsamic Vinegar IGP");
      expect(result.current.t("batch.acidity")).toBe("Total acidity (%)");
      expect(result.current.t("calendar.flagged")).toBe("Flagged");
      expect(result.current.t("dashboard.compliance")).toBe("Compliance Rate");
      expect(result.current.t("lab.upload")).toBe("Upload PDF report");
      expect(result.current.t("docs.checklist")).toBe("Submission Checklist");
    });

    it("returns the *target* language code on the language toggle key (UX shows the OTHER language)", () => {
      const { result } = renderHook(() => useLanguage(), { wrapper: wrap });
      // When in IT, toggle button advertises "EN".
      expect(result.current.t("general.language")).toBe("EN");
      act(() => result.current.toggleLang());
      expect(result.current.t("general.language")).toBe("IT");
    });
  });
});
