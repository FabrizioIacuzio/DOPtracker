import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/test/render";
import Index from "./Index";

describe("<Index />", () => {
  it("renders without crashing (Lovable placeholder)", () => {
    const { container } = renderWithProviders(<Index />);
    expect(container.firstChild).not.toBeNull();
  });

  it("includes the placeholder image marker so we notice if it ships in prod", () => {
    const { container } = renderWithProviders(<Index />);
    const marker = container.querySelector("[data-lovable-blank-page-placeholder]");
    expect(marker).not.toBeNull();
  });
});
