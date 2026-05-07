import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { freezeTime } from "@/test/fakes";
import { makeBatch } from "@/test/fixtures";
import { screen, within } from "@testing-library/react";
import DocumentsPage from "./DocumentsPage";

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<DocumentsPage />, {
    route: "/documents",
    ...opts,
  });
}

describe("<DocumentsPage />", () => {
  beforeEach(() => {
    freezeTime("2026-05-15T12:00:00.000Z");
  });

  it("renders the page title and the checklist trigger", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Documenti di Conformità" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Checklist di Invio/i })).toBeInTheDocument();
  });

  it("renders three rows for the current month and the two prior months", () => {
    mount();
    const rows = screen.getAllByRole("row");
    // 1 header + 3 data rows = 4
    expect(rows).toHaveLength(4);
  });

  it("status badges are 'Bozza' (current month), 'Pronto' (prev), 'Inviato' (prev-prev)", () => {
    mount();
    expect(screen.getByText("Bozza")).toBeInTheDocument();
    expect(screen.getByText("Pronto")).toBeInTheDocument();
    expect(screen.getByText("Inviato")).toBeInTheDocument();
  });

  it("aggregates batch counts and volumes per period", () => {
    const batches = [
      makeBatch({ id: "a", date: "2026-05-01", volume: 100 }),
      makeBatch({ id: "b", date: "2026-05-02", volume: 200 }),
      makeBatch({ id: "c", date: "2026-04-15", volume: 50 }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1); // skip header
    // First data row is the current month (May): 2 batches, 300 L (allow ICU variance).
    expect(within(dataRows[0]).getByText("2")).toBeInTheDocument();
    expect(within(dataRows[0]).getByText(/300\s*L/)).toBeInTheDocument();
    // Second row is April: 1 batch.
    expect(within(dataRows[1]).getByText("1")).toBeInTheDocument();
  });

  describe("PDF preview dialog", () => {
    it("opens when the row's 'Visualizza PDF' button is clicked", async () => {
      const { user } = mount();
      const viewButtons = screen.getAllByRole("button", { name: /Visualizza PDF/i });
      await user.click(viewButtons[0]);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("DICHIARAZIONE PERIODICA DI PRODUZIONE")).toBeInTheDocument();
    });

    it("shows the operator and ICQRF code (currently hardcoded)", async () => {
      const { user } = mount();
      await user.click(screen.getAllByRole("button", { name: /Visualizza PDF/i })[0]);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Acetaia Esempio S.r.l.")).toBeInTheDocument();
      expect(within(dialog).getByText("IT-041-BIO-123")).toBeInTheDocument();
      // "CSQA Certificazioni S.r.l." appears twice (header subtitle + body); both required.
      expect(within(dialog).getAllByText("CSQA Certificazioni S.r.l.").length).toBeGreaterThanOrEqual(2);
    });

    it("the summary table reflects this period's batch count + volume", async () => {
      const batches = [
        makeBatch({ id: "a", date: "2026-05-01", volume: 1000 }),
        makeBatch({ id: "b", date: "2026-05-02", volume: 1500 }),
      ];
      const { user } = mount({ preload: { batches, onboardingComplete: true } });
      await user.click(screen.getAllByRole("button", { name: /Visualizza PDF/i })[0]);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText(/2[,.]?500/)).toBeInTheDocument();
    });
  });

  describe("checklist dialog", () => {
    it("opens with the four documented submission steps in source order", async () => {
      const { user } = mount();
      await user.click(screen.getByRole("button", { name: /Checklist di Invio/i }));
      const dialog = await screen.findByRole("dialog");
      const text = dialog.textContent ?? "";
      expect(text.indexOf("Accedi al portale CSQA")).toBeGreaterThan(-1);
      expect(text.indexOf("Naviga su 'Dichiarazioni > Nuova Dichiarazione'")).toBeGreaterThan(-1);
      expect(text.indexOf("Allega il file PDF generato")).toBeGreaterThan(-1);
      expect(text.indexOf("Verifica i dati e clicca 'Invia'")).toBeGreaterThan(-1);
    });

    it("contains a 'Vai al portale CSQA' button (currently informational only)", async () => {
      const { user } = mount();
      await user.click(screen.getByRole("button", { name: /Checklist di Invio/i }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("button", { name: /Vai al portale CSQA/i })).toBeInTheDocument();
    });
  });
});
