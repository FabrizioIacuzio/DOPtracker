import { describe, it, expect } from "vitest";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";
import Onboarding from "./Onboarding";

function mount() {
  return renderWithProviders(<Onboarding />, {
    route: "/onboarding",
    routes: [
      { path: "/onboarding", element: <Onboarding /> },
      { path: "/home", element: <div data-testid="route-home">HOME</div> },
    ],
  });
}

async function advanceToStep1(user: ReturnType<typeof renderWithProviders>["user"]) {
  await user.click(screen.getByRole("button", { name: /Inizia ora/i }));
}

async function advanceToStep2(user: ReturnType<typeof renderWithProviders>["user"]) {
  await advanceToStep1(user);
  await user.click(screen.getByText("Aceto Balsamico IGP"));
  await user.click(screen.getByText("Aceto Balsamico di Modena IGP"));
  await user.click(screen.getByRole("button", { name: /Avanti/i }));
}

async function advanceToStep3(user: ReturnType<typeof renderWithProviders>["user"]) {
  await advanceToStep2(user);
  await user.type(screen.getByPlaceholderText("Acetaia Rossi S.r.l."), "My Co");
  await user.type(screen.getByPlaceholderText("Modena"), "MO");
  await user.click(screen.getByRole("button", { name: /Avanti/i }));
}

describe("<Onboarding />", () => {
  describe("step 0 — welcome", () => {
    it("renders the welcome title and CTA", () => {
      mount();
      expect(
        screen.getByRole("heading", { name: "Gestisci la conformità DOP/IGP" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Inizia ora/i })).toBeInTheDocument();
    });

    it("clicking the CTA advances to step 1", async () => {
      const { user } = mount();
      await advanceToStep1(user);
      expect(screen.getByRole("heading", { name: "Seleziona la tua denominazione" })).toBeInTheDocument();
    });

    it("the language toggle in the header switches the welcome strings to English", async () => {
      const { user } = mount();
      // The header toggle is the only button whose text is exactly "EN" before toggling.
      const toggle = screen.getAllByRole("button").find((b) => b.textContent?.trim() === "EN")!;
      await user.click(toggle);
      expect(screen.getByRole("heading", { name: "Manage DOP/IGP Compliance" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Get started/i })).toBeInTheDocument();
    });
  });

  describe("step 1 — denomination selection", () => {
    it("Next is disabled before any denomination is picked", async () => {
      const { user } = mount();
      await advanceToStep1(user);
      expect(screen.getByRole("button", { name: /Avanti/i })).toBeDisabled();
    });

    it("clicking the vinegar category reveals its denominations list", async () => {
      const { user } = mount();
      await advanceToStep1(user);
      await user.click(screen.getByText("Aceto Balsamico IGP"));
      expect(screen.getByText("Aceto Balsamico di Modena IGP")).toBeInTheDocument();
    });

    it("non-ABM denominations show 'Prossimamente' and clicking them does not enable Next", async () => {
      const { user } = mount();
      await advanceToStep1(user);
      await user.click(screen.getByText("Formaggi DOP"));
      const gorgonzola = screen.getByText("Gorgonzola DOP");
      expect(screen.getAllByText("Prossimamente").length).toBeGreaterThan(0);
      await user.click(gorgonzola);
      expect(screen.getByRole("button", { name: /Avanti/i })).toBeDisabled();
    });

    it("selecting ABM enables the Next button", async () => {
      const { user } = mount();
      await advanceToStep1(user);
      await user.click(screen.getByText("Aceto Balsamico IGP"));
      await user.click(screen.getByText("Aceto Balsamico di Modena IGP"));
      expect(screen.getByRole("button", { name: /Avanti/i })).toBeEnabled();
    });

    it("Back button returns to step 0", async () => {
      const { user } = mount();
      await advanceToStep1(user);
      await user.click(screen.getByRole("button", { name: /Indietro/i }));
      expect(screen.getByRole("heading", { name: "Gestisci la conformità DOP/IGP" })).toBeInTheDocument();
    });
  });

  describe("step 2 — company info", () => {
    it("Next is disabled until both name and province are filled", async () => {
      const { user } = mount();
      await advanceToStep2(user);
      const nextBtn = screen.getByRole("button", { name: /Avanti/i });
      expect(nextBtn).toBeDisabled();

      await user.type(screen.getByPlaceholderText("Acetaia Rossi S.r.l."), "Some Co");
      expect(nextBtn).toBeDisabled(); // province still empty

      await user.type(screen.getByPlaceholderText("Modena"), "MO");
      expect(nextBtn).toBeEnabled();
    });

    it("Next remains enabled even with empty employees field (employees is optional)", async () => {
      const { user } = mount();
      await advanceToStep2(user);
      await user.type(screen.getByPlaceholderText("Acetaia Rossi S.r.l."), "Co");
      await user.type(screen.getByPlaceholderText("Modena"), "MO");
      expect(screen.getByRole("button", { name: /Avanti/i })).toBeEnabled();
    });

    it("Back button returns to step 1 with the previously selected denomination still set", async () => {
      const { user } = mount();
      await advanceToStep2(user);
      await user.click(screen.getByRole("button", { name: /Indietro/i }));
      // Step 1 is visible again …
      expect(screen.getByRole("heading", { name: "Seleziona la tua denominazione" })).toBeInTheDocument();
      // … and Next is still enabled because the denom selection persisted.
      expect(screen.getByRole("button", { name: /Avanti/i })).toBeEnabled();
    });
  });

  describe("step 3 — confirmation + finish", () => {
    it("displays the chosen denomination and company line", async () => {
      const { user } = mount();
      await advanceToStep3(user);
      expect(screen.getByText("Aceto Balsamico di Modena IGP")).toBeInTheDocument();
      expect(screen.getByText("My Co — MO")).toBeInTheDocument();
    });

    it("'Vai alla dashboard' navigates to /home and persists the company info + onboarding flag", async () => {
      const { user } = mount();
      await advanceToStep3(user);
      await user.click(screen.getByRole("button", { name: /Vai alla dashboard/i }));

      // We landed on /home (which we wired up as a test route)
      expect(screen.getByTestId("route-home")).toBeInTheDocument();

      // Persistence: localStorage was written by the AppDataProvider's effects
      const stored = JSON.parse(localStorage.getItem("dop_company") ?? "null");
      expect(stored).toMatchObject({
        name: "My Co",
        province: "MO",
        denomination: "Aceto Balsamico di Modena IGP",
      });
      expect(JSON.parse(localStorage.getItem("dop_onboarded") ?? "false")).toBe(true);
    });
  });
});
