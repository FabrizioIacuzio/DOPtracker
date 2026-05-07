import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { freezeTime } from "@/test/fakes";
import { makeBatch } from "@/test/fixtures";
import { screen, within } from "@testing-library/react";
import DashboardPage from "./DashboardPage";

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="recharts-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown }) => (
    <div data-testid="line-chart" data-chart-data={JSON.stringify(data)}>{children}</div>
  ),
  Bar: () => null,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
}));

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<DashboardPage />, {
    route: "/dashboard",
    ...opts,
  });
}

describe("<DashboardPage />", () => {
  beforeEach(() => {
    freezeTime("2026-05-15T12:00:00.000Z");
  });

  it("renders the page heading", () => {
    mount();
    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("renders the four KPI labels", () => {
    mount();
    expect(screen.getByText("Lotti questo mese")).toBeInTheDocument();
    expect(screen.getByText("Volume Produzione")).toBeInTheDocument();
    expect(screen.getByText("Tasso di Conformità")).toBeInTheDocument();
    expect(screen.getByText("Non conformità")).toBeInTheDocument();
  });

  it("KPI values match the same calculations as HomePage (current month only)", () => {
    const batches = [
      makeBatch({ id: "a", date: "2026-05-01", hasWarnings: false, volume: 1000 }),
      makeBatch({ id: "b", date: "2026-05-15", hasWarnings: true, volume: 500 }),
      makeBatch({ id: "out", date: "2026-04-30", hasWarnings: false, volume: 9999 }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });

    const monthCard = screen.getByText("Lotti questo mese").closest("div")?.parentElement;
    expect(within(monthCard!).getByText("2")).toBeInTheDocument();

    const nonConfCard = screen.getByText("Non conformità").closest("div")?.parentElement;
    expect(within(nonConfCard!).getByText("1")).toBeInTheDocument();

    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("with no batches, compliance rate defaults to 100% and other counts to 0", () => {
    mount({ preload: { batches: [], onboardingComplete: true } });
    expect(screen.getByText("100%")).toBeInTheDocument();
    // Two zero values appear: monthCount and nonConf.
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(2);
  });

  it("acidity chart slices to the last 20 batches", () => {
    const batches = Array.from({ length: 25 }).map((_, i) =>
      makeBatch({ id: `${i}`, batchId: `ABM-XXX-${i.toString().padStart(4, "0")}`, acidity: 6 + i }),
    );
    mount({ preload: { batches, onboardingComplete: true } });
    const data = JSON.parse(screen.getByTestId("line-chart").getAttribute("data-chart-data") ?? "[]");
    expect(data).toHaveLength(20);
  });

  it("acidity chart attaches min=6 to every datapoint", () => {
    const batches = [
      makeBatch({ id: "1", batchId: "ABM-X-0001", acidity: 6.2 }),
      makeBatch({ id: "2", batchId: "ABM-X-0002", acidity: 5.8 }),
    ];
    mount({ preload: { batches, onboardingComplete: true } });
    const data = JSON.parse(screen.getByTestId("line-chart").getAttribute("data-chart-data") ?? "[]");
    expect(data.every((d: { min: number }) => d.min === 6)).toBe(true);
  });

  it("renders chart placeholders instead of charts when there are no batches", () => {
    mount({ preload: { batches: [], onboardingComplete: true } });
    expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
    expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Registra Lotto →/).length).toBe(2);
  });
});
