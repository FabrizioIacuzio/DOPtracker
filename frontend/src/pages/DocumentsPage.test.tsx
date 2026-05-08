import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { screen, waitFor, within } from "@testing-library/react";
import DocumentsPage from "./DocumentsPage";
import * as mod from "../api/submissions";

vi.mock("../api/submissions", () => ({
  submissionsApi: { list: vi.fn(), submit: vi.fn() },
}))

const mockList = vi.mocked(mod.submissionsApi.list)

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<DocumentsPage />, {
    route: "/documents",
    ...opts,
  });
}

describe("<DocumentsPage />", () => {
  beforeEach(() => {
    mockList.mockResolvedValue({ submissions: [], total: 0, page: 1 })
  })

  it("renders the page title", async () => {
    mount();
    expect(screen.getByRole("heading", { name: "Documenti di Conformità" })).toBeInTheDocument();
  });

  it("shows loading state while fetching", () => {
    mockList.mockReturnValue(new Promise(() => {})); // never resolves
    mount();
    expect(screen.getByText("Caricamento…")).toBeInTheDocument();
  });

  it("shows empty state when there are no submissions", async () => {
    mount();
    await waitFor(() => expect(screen.getByText("Nessun documento.")).toBeInTheDocument());
  });

  it("renders a row per submission with denomination, ruleId, channel, status badge, and date", async () => {
    mockList.mockResolvedValue({
      submissions: [
        {
          id: "s1", jobId: null, producerId: "p1", denominationId: "abm-igp",
          ruleId: "dichiarazione-mensile", channel: "web_portal", status: "sent",
          recipient: null, sentAt: "2026-05-01T10:00:00Z", externalRef: null,
          errorMessage: null, createdAt: "2026-05-01T09:00:00Z",
        },
      ],
      total: 1, page: 1,
    });
    mount();
    await waitFor(() => expect(screen.getByText("abm-igp")).toBeInTheDocument());
    expect(screen.getByText("dichiarazione-mensile")).toBeInTheDocument();
    expect(screen.getByText("web_portal")).toBeInTheDocument();
    expect(screen.getByText("Inviato")).toBeInTheDocument();
  });

  it("shows 'Errore' badge for failed submissions", async () => {
    mockList.mockResolvedValue({
      submissions: [{
        id: "s2", jobId: null, producerId: "p1", denominationId: "abm-igp",
        ruleId: "monthly-report", channel: "email", status: "failed",
        recipient: null, sentAt: null, externalRef: null,
        errorMessage: "SMTP timeout", createdAt: new Date().toISOString(),
      }],
      total: 1, page: 1,
    });
    mount();
    await waitFor(() => expect(screen.getByText("Errore")).toBeInTheDocument());
  });

  describe("details dialog", () => {
    it("opens when the 'Dettagli' button is clicked", async () => {
      mockList.mockResolvedValue({
        submissions: [{
          id: "s3", jobId: null, producerId: "p1", denominationId: "asiago",
          ruleId: "monthly-report", channel: "web_portal", status: "manual_pending",
          recipient: null, sentAt: null, externalRef: null,
          errorMessage: null, createdAt: new Date().toISOString(),
        }],
        total: 1, page: 1,
      });
      const { user } = mount();
      await waitFor(() => screen.getByText("Dettagli"));
      await user.click(screen.getByRole("button", { name: /Dettagli/i }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("Dettagli Invio")).toBeInTheDocument();
    });

    it("shows 'Avvia invio' button only for manual_pending submissions", async () => {
      mockList.mockResolvedValue({
        submissions: [{
          id: "s4", jobId: null, producerId: "p1", denominationId: "asiago",
          ruleId: "monthly-report", channel: "web_portal", status: "manual_pending",
          recipient: null, sentAt: null, externalRef: null,
          errorMessage: null, createdAt: new Date().toISOString(),
        }],
        total: 1, page: 1,
      });
      const { user } = mount();
      await waitFor(() => screen.getByText("Dettagli"));
      await user.click(screen.getByRole("button", { name: /Dettagli/i }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("button", { name: /Avvia invio/i })).toBeInTheDocument();
    });
  });
});
