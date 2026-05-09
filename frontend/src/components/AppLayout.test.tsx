import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import AppLayout from "./AppLayout";
import { makeCompany } from "@/test/fixtures";

interface MountOpts {
  route?: string;
  onboardingComplete?: boolean;
  companyName?: string | null;
}

function mount({ route = "/home", onboardingComplete = true, companyName = "Acetaia Test" }: MountOpts = {}) {
  // Seed localStorage BEFORE the AppDataProvider mounts so initial state matches.
  if (companyName !== null) {
    localStorage.setItem("dop_company", JSON.stringify(makeCompany({ name: companyName })));
  }
  localStorage.setItem("dop_onboarded", JSON.stringify(onboardingComplete));

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageProvider>
          <AppDataProvider>
            <MemoryRouter initialEntries={[route]}>
              <Routes>
                <Route path="/onboarding" element={<div data-testid="ONBOARDING">ONBOARDING</div>} />
                <Route element={<AppLayout />}>
                  <Route path="/home" element={<div data-testid="ROUTE-home">HOME</div>} />
                  <Route path="/calendar" element={<div data-testid="ROUTE-calendar">CALENDAR</div>} />
                  <Route path="/dashboard" element={<div data-testid="ROUTE-dashboard">DASHBOARD</div>} />
                  <Route path="/batch/new" element={<div data-testid="ROUTE-batch-new">BATCH NEW</div>} />
                  <Route path="/batch/:id" element={<div data-testid="ROUTE-batch-id">BATCH ID</div>} />
                  <Route path="/lab-reports" element={<div data-testid="ROUTE-lab">LAB</div>} />
                  <Route path="/documents" element={<div data-testid="ROUTE-docs">DOCS</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </AppDataProvider>
        </LanguageProvider>
      </TooltipProvider>
    </QueryClientProvider>,
  );
  return { ...result, user };
}

function findLanguageToggle(): HTMLElement {
  // The language button is the only one whose visible text is exactly "EN" or "IT".
  const buttons = screen.getAllByRole("button");
  const btn = buttons.find((b) => {
    const t = b.textContent?.trim() ?? "";
    return t === "EN" || t === "IT";
  });
  if (!btn) throw new Error("language toggle not found");
  return btn;
}

function findMenuTrigger(): HTMLElement {
  // The dropdown trigger is a <button> with the rounded-full class wrapping
  // the Menu icon. Pick the one that is NOT the language toggle.
  const buttons = screen.getAllByRole("button");
  const trigger = buttons.find(
    (b) =>
      b.className.includes("rounded-full") &&
      b.textContent?.trim() !== "EN" &&
      b.textContent?.trim() !== "IT",
  );
  if (!trigger) throw new Error("menu trigger not found");
  return trigger;
}

describe("<AppLayout />", () => {
  it("redirects to /onboarding when onboarding is incomplete", () => {
    mount({ route: "/home", onboardingComplete: false, companyName: null });
    expect(screen.getByTestId("ONBOARDING")).toBeInTheDocument();
    // Layout chrome (logo) must NOT have rendered.
    expect(screen.queryByText("Comply")).not.toBeInTheDocument();
  });

  describe("when onboarded", () => {
    it("renders the DOPComply wordmark in the header", () => {
      mount();
      expect(screen.getByText("DOP")).toBeInTheDocument();
      expect(screen.getByText("Comply")).toBeInTheDocument();
    });

    it("renders the matched child route via Outlet", () => {
      mount({ route: "/home" });
      expect(screen.getByTestId("ROUTE-home")).toBeInTheDocument();
    });

    it("shows the company name from context", () => {
      mount({ companyName: "Acetaia Test S.r.l." });
      expect(screen.getByText("Acetaia Test S.r.l.")).toBeInTheDocument();
    });

    it("renders a language toggle that advertises the OTHER language (default IT shows 'EN')", () => {
      mount();
      expect(findLanguageToggle()).toHaveTextContent("EN");
    });

    it("toggles the language when the toggle button is clicked", async () => {
      const { user } = mount();
      await user.click(findLanguageToggle());
      expect(findLanguageToggle()).toHaveTextContent("IT");
    });

    it("opens the navigation dropdown listing all six items in source order", async () => {
      const { user } = mount();
      await user.click(findMenuTrigger());
      const menu = await screen.findByRole("menu");
      const labels = within(menu).getAllByRole("menuitem").map((i) => i.textContent?.trim());
      expect(labels).toEqual([
        "Home",
        "Calendario",
        "Registra Lotto",
        "Dashboard",
        "Rapporti Lab",
        "Documenti",
      ]);
    });

    it("navigates when a menu item is clicked", async () => {
      const { user } = mount({ route: "/home" });
      await user.click(findMenuTrigger());
      const calendarItem = await screen.findByRole("menuitem", { name: "Calendario" });
      await user.click(calendarItem);
      expect(screen.getByTestId("ROUTE-calendar")).toBeInTheDocument();
    });

    it("lets a user return to onboarding to test another product", async () => {
      const { user } = mount({ route: "/dashboard" });
      await user.click(screen.getByRole("button", { name: /Cambia prodotto/i }));
      expect(screen.getByTestId("ONBOARDING")).toBeInTheDocument();
      expect(JSON.parse(localStorage.getItem("dop_onboarded") ?? "true")).toBe(false);
    });
  });
});
