import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { freezeTime } from "@/test/fakes";
import { makeBatch } from "@/test/fixtures";
import { screen, within } from "@testing-library/react";
import HomePage from "./HomePage";

// Recharts in jsdom is fragile and visually unverifiable here. Replace each
// chart-tree component with a passthrough that exposes the `data` it received
// as JSON so we can still assert on chart inputs.
vi.mock("recharts", async () => {
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-container">{children}</div>
    ),
    BarChart: ({ children, data }: { children: React.ReactNode; data: unknown }) => (
      <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    LineChart: ({ children, data }: { children: React.ReactNode; data: unknown }) => (
      <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: () => null,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
  };
});

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<HomePage />, {
    routes: [
      { path: "/home", element: <HomePage /> },
      { path: "/batch/new", element: <div data-testid="route-batch-new">BATCH-NEW</div> },
      { path: "/batch/:id", element: <div data-testid="route-batch-id">BATCH-ID</div> },
    ],
    route: "/home",
    ...opts,
  });
}

const TODAY = "2026-05-15T12:00:00.000Z";

describe("<HomePage /> — calendar section", () => {
  beforeEach(() => {
    freezeTime(TODAY);
  });

  it("renders the calendar title and a 'Nuovo Lotto' button at the top", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Calendario Produzione" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Nuovo Lotto/i })).toBeInTheDocument();
  });

  it("clicking an empty day navigates to /batch/new with the date param", async () => {
    const { user } = mount();
    const day7 = screen.getAllByRole("button").find((b) => within(b).queryByText("7"));
    await user.click(day7!);
    expect(screen.getByTestId("route-batch-new")).toBeInTheDocument();
  });

  it("a day with batches opens a dialog (does NOT navigate)", async () => {
    const batches = [makeBatch({ date: "2026-05-07", batchId: "ABM-EXAMPLE" })];
    const { user } = mount({ preload: { batches, onboardingComplete: true } });
    const day7 = screen.getAllByRole("button").find((b) => within(b).queryByText("7"));
    await user.click(day7!);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("ABM-EXAMPLE")).toBeInTheDocument();
  });
});

describe("<HomePage /> — recent batches section", () => {
  beforeEach(() => {
    freezeTime(TODAY);
  });

  it("does not render the section when there are no batches", () => {
    mount();
    expect(screen.queryByRole("heading", { name: "Registra Lotto" })).not.toBeInTheDocument();
  });

  it("renders up to 10 most-recent batches sorted by date desc", () => {
    const batches = Array.from({ length: 12 }).map((_, i) =>
      makeBatch({ id: `b-${i}`, batchId: `ABM-${i.toString().padStart(4, "0")}`, date: `2026-04-${String(i + 1).padStart(2, "0")}` }),
    );
    mount({ preload: { batches, onboardingComplete: true } });
    // Heading exists.
    expect(screen.getByRole("heading", { name: "Registra Lotto" })).toBeInTheDocument();
    // The newest 10 should be visible by their batchId.
    for (let i = 11; i >= 2; i--) {
      expect(screen.getByText(`ABM-${i.toString().padStart(4, "0")}`)).toBeInTheDocument();
    }
    // The oldest 2 should NOT be visible.
    expect(screen.queryByText("ABM-0001")).not.toBeInTheDocument();
    expect(screen.queryByText("ABM-0000")).not.toBeInTheDocument();
  });

  it("shows the warning badge on flagged batches", () => {
    const batches = [makeBatch({ batchId: "ABM-FLAG", date: "2026-05-01", hasWarnings: true })];
    mount({ preload: { batches, onboardingComplete: true } });
    // The destructive ⚠ badge is text content "⚠".
    expect(screen.getByText("⚠")).toBeInTheDocument();
  });

  it("clicking a batch navigates to /batch/:id", async () => {
    const batches = [makeBatch({ id: "edit-me", batchId: "ABM-EDIT", date: "2026-05-01" })];
    const { user } = mount({ preload: { batches, onboardingComplete: true } });
    await user.click(screen.getByText("ABM-EDIT"));
    expect(screen.getByTestId("route-batch-id")).toBeInTheDocument();
  });
});

describe("<HomePage /> — KPIs", () => {
  beforeEach(() => {
    // Frozen current month is 2026-05.
    freezeTime(TODAY);
  });

  it("counts only batches in the current month for 'Lotti questo mese'", () => {
    const batches = [
      makeBatch({ id: "in-1", date: "2026-05-03", volume: 100 }),
      makeBatch({ id: "in-2", date: "2026-05-12", volume: 200 }),
      makeBatch({ id: "out-1", date: "2026-04-30", volume: 999 }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    // KPI value is rendered as a sibling of the label "Lotti questo mese".
    const label = screen.getByText("Lotti questo mese");
    const card = label.closest("div")?.parentElement;
    expect(card).toBeDefined();
    expect(within(card!).getByText("2")).toBeInTheDocument();
  });

  it("computes total monthly volume with toLocaleString and ' L' suffix", () => {
    const batches = [
      makeBatch({ id: "1", date: "2026-05-01", volume: 1500 }),
      makeBatch({ id: "2", date: "2026-05-02", volume: 2500 }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    // 4000.toLocaleString() in en-US is "4,000"; in jsdom default it depends
    // on ICU. Accept either "4,000 L" or "4000 L" to stay portable.
    const total = screen.getByText(/4[,.]?000\s*L/);
    expect(total).toBeInTheDocument();
  });

  it("compliance rate is 100% when there are no batches in the month", () => {
    mount({ preload: { batches: [], onboardingComplete: true } });
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("compliance rate uses Math.round((conformant/month) * 100)", () => {
    // 2 conformant of 3 = 67%
    const batches = [
      makeBatch({ id: "a", date: "2026-05-01", hasWarnings: false }),
      makeBatch({ id: "b", date: "2026-05-02", hasWarnings: false }),
      makeBatch({ id: "c", date: "2026-05-03", hasWarnings: true }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("non-conformity KPI counts batches with hasWarnings in the month", () => {
    const batches = [
      makeBatch({ id: "a", date: "2026-05-01", hasWarnings: true }),
      makeBatch({ id: "b", date: "2026-05-02", hasWarnings: true }),
      makeBatch({ id: "c", date: "2026-05-03", hasWarnings: false }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    const label = screen.getByText("Non conformità");
    const card = label.closest("div")?.parentElement;
    expect(within(card!).getByText("2")).toBeInTheDocument();
  });
});

describe("<HomePage /> — chart data prep", () => {
  beforeEach(() => {
    freezeTime(TODAY);
  });

  it("volume chart receives the last six monthly aggregates with rounded volume", () => {
    const batches = [
      makeBatch({ id: "1", date: "2026-01-15", volume: 100 }),
      makeBatch({ id: "2", date: "2026-02-15", volume: 200 }),
      makeBatch({ id: "3", date: "2026-03-15", volume: 300 }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    const chart = screen.getByTestId("bar-chart");
    const data = JSON.parse(chart.getAttribute("data-chart-data") ?? "[]");
    expect(data).toEqual([
      { month: expect.any(String), volume: 100 },
      { month: expect.any(String), volume: 200 },
      { month: expect.any(String), volume: 300 },
    ]);
  });

  it("acidity chart receives at most 20 batches with batch=last 4 chars and min=6", () => {
    const batches = Array.from({ length: 25 }).map((_, i) =>
      makeBatch({ id: `b-${i}`, batchId: `ABM-XXXX-${i.toString().padStart(4, "0")}`, acidity: 6.5 + (i % 2) }),
    );
    mount({ preload: { batches, onboardingComplete: true } });
    const chart = screen.getByTestId("line-chart");
    const data = JSON.parse(chart.getAttribute("data-chart-data") ?? "[]");
    expect(data).toHaveLength(20);
    data.forEach((d: { batch: string; min: number }) => {
      expect(d.batch).toMatch(/^[0-9]{4}$/);
      expect(d.min).toBe(6);
    });
  });

  it("when there are no batches, charts show the placeholder text instead", () => {
    mount({ preload: { batches: [], onboardingComplete: true } });
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    // The placeholder uses the t('nav.batch') string + arrow.
    const placeholders = screen.getAllByText(/Registra Lotto →/);
    expect(placeholders.length).toBeGreaterThanOrEqual(1);
  });
});
