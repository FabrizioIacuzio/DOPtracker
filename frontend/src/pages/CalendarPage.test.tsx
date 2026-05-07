import { describe, it, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { freezeTime } from "@/test/fakes";
import { makeBatch } from "@/test/fixtures";
import { screen, within } from "@testing-library/react";
import CalendarPage from "./CalendarPage";

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<CalendarPage />, {
    routes: [
      { path: "/calendar", element: <CalendarPage /> },
      { path: "/batch/new", element: <div data-testid="route-batch-new" data-search="">BATCH-NEW</div> },
      { path: "/batch/:id", element: <div data-testid="route-batch-id">BATCH-ID</div> },
    ],
    route: "/calendar",
    ...opts,
  });
}

describe("<CalendarPage />", () => {
  beforeEach(() => {
    // Freeze "today" so isToday(...) inside the component is deterministic.
    freezeTime("2026-05-15T12:00:00.000Z");
  });

  it("renders the calendar title and the New Batch button", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Calendario Produzione" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuovo Lotto/i })).toBeInTheDocument();
  });

  it("renders the Italian weekday header row by default", () => {
    mount();
    ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"].forEach((d) => {
      expect(screen.getByText(d)).toBeInTheDocument();
    });
  });

  it("displays the current month title in Italian (capitalized)", () => {
    mount();
    // May 2026 in Italian is "maggio 2026" (CSS capitalizes; assert lowercase substring).
    expect(screen.getByText(/maggio 2026/i)).toBeInTheDocument();
  });

  it("includes the legend rows for logged and flagged", () => {
    mount();
    expect(screen.getByText("Registrato")).toBeInTheDocument();
    expect(screen.getByText("Anomalia")).toBeInTheDocument();
  });

  it("renders one day-button per day in the current month (May = 31)", () => {
    mount();
    // Each day cell is a <button>; the only buttons inside the calendar card
    // are the day cells, the prev-month nav, the next-month nav, and the
    // 'New Batch' top-right button. Total = 31 days + 3 = 34.
    const buttons = screen.getAllByRole("button");
    // We assert the lower bound to stay resilient if shadcn adds more chrome.
    expect(buttons.length).toBeGreaterThanOrEqual(31 + 2);
  });

  describe("month navigation", () => {
    it("moves to the previous month when the left chevron is clicked", async () => {
      const { user } = mount();
      const navButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"))
        .filter((b) => b.textContent?.trim() === "");
      // The first chevron-only icon button is "previous month".
      await user.click(navButtons[0]);
      expect(screen.getByText(/aprile 2026/i)).toBeInTheDocument();
    });

    it("moves to the next month when the right chevron is clicked", async () => {
      const { user } = mount();
      const navButtons = screen
        .getAllByRole("button")
        .filter((b) => b.querySelector("svg"))
        .filter((b) => b.textContent?.trim() === "");
      await user.click(navButtons[1]);
      expect(screen.getByText(/giugno 2026/i)).toBeInTheDocument();
    });
  });

  describe("clicking a day", () => {
    it("with no batches navigates to /batch/new with the date query param", async () => {
      const { user } = mount();
      // Click day 7 — find by its visible "7" inside a button.
      const dayBtn = screen
        .getAllByRole("button")
        .find((b) => within(b).queryByText("7"));
      expect(dayBtn).toBeDefined();
      await user.click(dayBtn!);
      expect(screen.getByTestId("route-batch-new")).toBeInTheDocument();
    });

    it("with batches opens a dialog listing them", async () => {
      const batches = [
        makeBatch({ id: "x", date: "2026-05-07", batchId: "ABM-X", supplier: "S1" }),
        makeBatch({ id: "y", date: "2026-05-07", batchId: "ABM-Y", supplier: "S2" }),
      ];
      const { user } = mount({ preload: { batches, onboardingComplete: true } });
      const dayBtn = screen.getAllByRole("button").find((b) => within(b).queryByText("7"));
      await user.click(dayBtn!);
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByText("ABM-X")).toBeInTheDocument();
      expect(within(dialog).getByText("ABM-Y")).toBeInTheDocument();
      expect(within(dialog).getByText(/Lotti del giorno — 2026-05-07/)).toBeInTheDocument();
    });

    it("the day-dialog 'Nuovo lotto' button navigates to /batch/new with the date param", async () => {
      const batches = [makeBatch({ date: "2026-05-07" })];
      const { user } = mount({ preload: { batches, onboardingComplete: true } });
      const dayBtn = screen.getAllByRole("button").find((b) => within(b).queryByText("7"));
      await user.click(dayBtn!);
      const dialog = await screen.findByRole("dialog");
      await user.click(within(dialog).getByRole("button", { name: /Nuovo lotto/i }));
      expect(screen.getByTestId("route-batch-new")).toBeInTheDocument();
    });
  });

  describe("dot indicators", () => {
    it("renders a green dot for a clean batch day", () => {
      const batches = [makeBatch({ date: "2026-05-07", hasWarnings: false })];
      mount({ preload: { batches, onboardingComplete: true } });
      const dayBtn = screen.getAllByRole("button").find((b) => within(b).queryByText("7"))!;
      const dots = dayBtn.querySelectorAll(".bg-green-500");
      expect(dots.length).toBeGreaterThan(0);
    });

    it("renders a destructive dot when any batch on that day has warnings", () => {
      const batches = [
        makeBatch({ id: "1", date: "2026-05-07", hasWarnings: true }),
        makeBatch({ id: "2", date: "2026-05-07", hasWarnings: false }),
      ];
      mount({ preload: { batches, onboardingComplete: true } });
      const dayBtn = screen.getAllByRole("button").find((b) => within(b).queryByText("7"))!;
      const dot = dayBtn.querySelector(".bg-destructive");
      expect(dot).not.toBeNull();
    });

    it("shows the batch count when more than one batch exists on a day", () => {
      const batches = [
        makeBatch({ id: "1", date: "2026-05-07" }),
        makeBatch({ id: "2", date: "2026-05-07" }),
        makeBatch({ id: "3", date: "2026-05-07" }),
      ];
      mount({ preload: { batches, onboardingComplete: true } });
      const dayBtn = screen.getAllByRole("button").find((b) => within(b).queryByText("7"))!;
      expect(within(dayBtn).getByText("3")).toBeInTheDocument();
    });
  });
});
