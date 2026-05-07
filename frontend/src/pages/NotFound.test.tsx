import { describe, it, expect, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import NotFound from "./NotFound";
import { screen } from "@testing-library/react";

describe("<NotFound />", () => {
  it("renders the 404 heading", () => {
    renderWithProviders(<NotFound />, { route: "/garbage" });
    expect(screen.getByRole("heading", { level: 1, name: "404" })).toBeInTheDocument();
  });

  it("shows the user-friendly explanation", () => {
    renderWithProviders(<NotFound />, { route: "/garbage" });
    expect(screen.getByText("Oops! Page not found")).toBeInTheDocument();
  });

  it("links back to the home route", () => {
    renderWithProviders(<NotFound />, { route: "/garbage" });
    const link = screen.getByRole("link", { name: /return to home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("logs the unmatched pathname to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProviders(<NotFound />, { route: "/some/missing/path" });
    expect(spy).toHaveBeenCalledWith(
      "404 Error: User attempted to access non-existent route:",
      "/some/missing/path",
    );
  });
});
