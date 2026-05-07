import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { freezeTime, seedRandomUuid } from "@/test/fakes";
import { makeLabReport } from "@/test/fixtures";
import { screen, within } from "@testing-library/react";
import LabReportsPage from "./LabReportsPage";

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<LabReportsPage />, {
    route: "/lab-reports",
    ...opts,
  });
}

describe("<LabReportsPage />", () => {
  beforeEach(() => {
    freezeTime("2026-05-15T12:00:00.000Z");
    seedRandomUuid("lab-uuid");
  });

  describe("empty state", () => {
    it("renders the page heading and the upload area", () => {
      mount();
      expect(screen.getByRole("heading", { name: "Rapporti di Laboratorio" })).toBeInTheDocument();
      expect(screen.getByText(/Trascina qui il file PDF/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Carica rapporto PDF/i })).toBeInTheDocument();
    });

    it("does NOT render the reports table when no reports exist", () => {
      mount();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("does NOT render the extracted-values panel when no report is selected", () => {
      mount();
      expect(screen.queryByText("Valori Estratti (simulazione AI)")).not.toBeInTheDocument();
    });
  });

  describe("upload via file input", () => {
    it("creates a LabReport with the documented hardcoded fields and adds it to context", async () => {
      const { container, user } = mount();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      const file = new File(["fake pdf bytes"], "test-report.pdf", { type: "application/pdf" });
      await user.upload(input, file);

      const stored = JSON.parse(localStorage.getItem("dop_labReports") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        id: "lab-uuid-1",
        fileName: "test-report.pdf",
        labName: "Laboratorio Analisi Modena",
        date: "2026-05-15",
        status: "processed",
        extractedValues: {
          acidity: 6.8,
          density: 1.24,
          sugars: 145,
          dryExtract: 30.2,
          ash: 0.8,
        },
      });
    });

    it("reveals the extracted-values panel after upload", async () => {
      const { container, user } = mount();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, new File([""], "x.pdf", { type: "application/pdf" }));
      expect(screen.getByText("Valori Estratti (simulazione AI)")).toBeInTheDocument();
    });

    it("renders the reports table with the new report's row after upload", async () => {
      const { container, user } = mount();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      await user.upload(input, new File([""], "fancy.pdf", { type: "application/pdf" }));
      const table = screen.getByRole("table");
      expect(within(table).getByText("fancy.pdf")).toBeInTheDocument();
      expect(within(table).getByText("Laboratorio Analisi Modena")).toBeInTheDocument();
      expect(within(table).getByText("2026-05-15")).toBeInTheDocument();
    });
  });

  describe("table rendering with preloaded reports", () => {
    it("renders one row per report and shows the correct status badge", () => {
      const reports = [
        makeLabReport({ id: "a", fileName: "a.pdf", status: "processed" }),
        makeLabReport({ id: "b", fileName: "b.pdf", status: "pending", extractedValues: undefined }),
      ];
      mount({ preload: { labReports: reports, onboardingComplete: true } });
      const table = screen.getByRole("table");
      expect(within(table).getByText("a.pdf")).toBeInTheDocument();
      expect(within(table).getByText("b.pdf")).toBeInTheDocument();
      expect(within(table).getByText("Elaborato")).toBeInTheDocument();
      expect(within(table).getByText("In attesa")).toBeInTheDocument();
    });

    it("clicking a row reveals the extracted-values panel for that report", async () => {
      const reports = [
        makeLabReport({ id: "a", fileName: "a.pdf", extractedValues: undefined }),
        makeLabReport({ id: "b", fileName: "b.pdf", extractedValues: { acidity: 7.2 } }),
      ];
      const { user } = mount({ preload: { labReports: reports, onboardingComplete: true } });
      // Selecting the second row (which has extractedValues) should show the panel.
      await user.click(screen.getByText("b.pdf"));
      expect(screen.getByText("Valori Estratti (simulazione AI)")).toBeInTheDocument();
      expect(screen.getByText("7.2")).toBeInTheDocument();
    });
  });
});
