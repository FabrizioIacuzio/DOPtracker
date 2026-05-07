import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NavLink } from "./NavLink";

function renderAt(path: string): HTMLElement {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="*"
          element={
            <NavLink to="/active" className="base" activeClassName="is-active" pendingClassName="is-pending">
              link
            </NavLink>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  return screen.getByRole("link", { name: "link" });
}

describe("<NavLink />", () => {
  it("renders an anchor pointing at `to`", () => {
    const link = renderAt("/anywhere");
    expect(link).toHaveAttribute("href", "/active");
  });

  it("applies the base className when not active", () => {
    const link = renderAt("/anywhere");
    expect(link.className).toContain("base");
    expect(link.className).not.toContain("is-active");
  });

  it("applies activeClassName when the route matches `to`", () => {
    const link = renderAt("/active");
    expect(link.className).toContain("base");
    expect(link.className).toContain("is-active");
  });

  it("forwards a ref to the underlying anchor", () => {
    let ref: HTMLAnchorElement | null = null;
    render(
      <MemoryRouter>
        <NavLink ref={(el) => { ref = el; }} to="/x">link</NavLink>
      </MemoryRouter>,
    );
    expect(ref).toBeInstanceOf(HTMLAnchorElement);
  });
});
