import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";

function mountAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

/**
 * AppSidebar is currently defined but not mounted by App.tsx. These tests
 * cover its surface area so any future re-introduction or refactor stays
 * faithful to the documented behaviour.
 */
describe("<AppSidebar />", () => {
  it("renders the DOPComply wordmark", () => {
    mountAt("/calendar");
    expect(screen.getByText("DOP")).toBeInTheDocument();
    expect(screen.getByText("Comply")).toBeInTheDocument();
  });

  it("renders all five nav items with Italian labels by default", () => {
    mountAt("/calendar");
    expect(screen.getByRole("link", { name: /Calendario/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Registra Lotto/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Rapporti Lab/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Documenti/i })).toBeInTheDocument();
  });

  it("nav links point to their documented routes", () => {
    mountAt("/calendar");
    expect(screen.getByRole("link", { name: /Calendario/i })).toHaveAttribute("href", "/calendar");
    expect(screen.getByRole("link", { name: /Registra Lotto/i })).toHaveAttribute("href", "/batch/new");
    expect(screen.getByRole("link", { name: /Dashboard/i })).toHaveAttribute("href", "/dashboard");
    expect(screen.getByRole("link", { name: /Rapporti Lab/i })).toHaveAttribute("href", "/lab-reports");
    expect(screen.getByRole("link", { name: /Documenti/i })).toHaveAttribute("href", "/documents");
  });

  it("does NOT render the 'Home' nav item (deliberately omitted from sidebar)", () => {
    mountAt("/home");
    expect(screen.queryByRole("link", { name: /^Home$/i })).not.toBeInTheDocument();
  });
});
