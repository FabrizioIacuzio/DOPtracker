import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { freezeTime, seedRandomUuid, seedMathRandom } from "@/test/fakes";
import { makeBatch } from "@/test/fixtures";
import { screen } from "@testing-library/react";
import BatchForm from "./BatchForm";

// Sonner is the toast library used by BatchForm directly. Mock its `toast`
// API so we can assert success calls without rendering Sonner's UI.
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast as sonnerToast } from "sonner";

/**
 * The shadcn <Label> in BatchForm is a sibling of <Input> (no htmlFor),
 * so RTL's getByLabelText can't find them. Walk: label text -> field wrapper
 * -> the input or textarea inside.
 */
function fieldByLabel(text: string | RegExp): HTMLInputElement | HTMLTextAreaElement {
  const label = screen.getByText(text, { selector: "label" });
  const wrapper = label.parentElement;
  if (!wrapper) throw new Error(`No parent for label: ${String(text)}`);
  const input = wrapper.querySelector("input, textarea");
  if (!input) throw new Error(`No input/textarea next to label: ${String(text)}`);
  return input as HTMLInputElement | HTMLTextAreaElement;
}

function mount(opts: Parameters<typeof renderWithProviders>[1] = {}) {
  return renderWithProviders(<BatchForm />, {
    routes: [
      { path: "/home", element: <div data-testid="route-home">HOME</div> },
      { path: "/batch/new", element: <BatchForm /> },
      { path: "/batch/:id", element: <BatchForm /> },
    ],
    ...opts,
  });
}

describe("<BatchForm /> — new mode", () => {
  beforeEach(() => {
    freezeTime("2026-04-15T10:00:00.000Z");
    seedMathRandom([0.123]);
    seedRandomUuid("uuid");
  });

  it("renders all 14 form fields plus the notes textarea", () => {
    mount({ route: "/batch/new" });
    expect(fieldByLabel(/^Data$/)).toBeInTheDocument();
    expect(fieldByLabel(/^ID Lotto$/)).toBeInTheDocument();
    expect(fieldByLabel(/Fornitore materia prima/)).toBeInTheDocument();
    expect(fieldByLabel(/^Volume \(litri\)$/)).toBeInTheDocument();
    expect(fieldByLabel(/Acidità totale/)).toBeInTheDocument();
    expect(fieldByLabel(/Densità a 20°C/)).toBeInTheDocument();
    expect(fieldByLabel(/Zuccheri riduttori/)).toBeInTheDocument();
    expect(fieldByLabel(/Titolo alcolometrico/)).toBeInTheDocument();
    expect(fieldByLabel(/Estratto secco netto/)).toBeInTheDocument();
    expect(fieldByLabel(/Anidride solforosa totale/)).toBeInTheDocument();
    expect(fieldByLabel(/Ceneri/)).toBeInTheDocument();
    expect(fieldByLabel(/Mesi di invecchiamento/)).toBeInTheDocument();
    expect(fieldByLabel(/^ID Botte$/)).toBeInTheDocument();
    expect(fieldByLabel(/Temperatura imbottigliamento/)).toBeInTheDocument();
    expect(fieldByLabel(/^Note$/)).toBeInTheDocument();
  });

  it("auto-generates a deterministic batchId of the form ABM-YYYYMMDD-XXXX", () => {
    mount({ route: "/batch/new" });
    const idField = fieldByLabel(/^ID Lotto$/) as HTMLInputElement;
    expect(idField.value).toMatch(/^ABM-20260415-[A-Z0-9]{4}$/);
  });

  it("the batchId field is read-only", () => {
    mount({ route: "/batch/new" });
    const idField = fieldByLabel(/^ID Lotto$/);
    expect(idField).toHaveAttribute("readonly");
  });

  it("defaults the date field to today when no ?date= query param is present", () => {
    mount({ route: "/batch/new" });
    expect((fieldByLabel(/^Data$/) as HTMLInputElement).value).toBe("2026-04-15");
  });

  it("uses the ?date= query param for the date when present", () => {
    mount({ route: "/batch/new?date=2026-01-09" });
    expect((fieldByLabel(/^Data$/) as HTMLInputElement).value).toBe("2026-01-09");
  });

  it("Save button label is 'Salva lotto' for a new batch", () => {
    mount({ route: "/batch/new" });
    expect(screen.getByRole("button", { name: /Salva lotto/i })).toBeInTheDocument();
  });

  it("does NOT show the 'Modificato' badge on a new batch", () => {
    mount({ route: "/batch/new" });
    expect(screen.queryByText("Modificato")).not.toBeInTheDocument();
  });

  describe("validation banner", () => {
    it("appears with the documented Italian message when acidity is below 6", async () => {
      const { user } = mount({ route: "/batch/new" });
      const acidity = fieldByLabel(/Acidità totale/);
      await user.clear(acidity);
      await user.type(acidity, "5");
      expect(screen.getByText("Acidità sotto il minimo (6%)")).toBeInTheDocument();
    });

    it("disappears once the value is at or above the boundary", async () => {
      const { user } = mount({ route: "/batch/new" });
      const acidity = fieldByLabel(/Acidità totale/);
      await user.type(acidity, "5");
      expect(screen.getByText("Acidità sotto il minimo (6%)")).toBeInTheDocument();
      await user.clear(acidity);
      await user.type(acidity, "6");
      expect(screen.queryByText("Acidità sotto il minimo (6%)")).not.toBeInTheDocument();
    });

    it("does not block save (pinned current behaviour — see KNOWN_ISSUES.md)", async () => {
      const { user } = mount({ route: "/batch/new" });
      await user.type(fieldByLabel(/Acidità totale/), "5");
      expect(screen.getByRole("button", { name: /Salva lotto/i })).toBeEnabled();
    });
  });

  describe("save", () => {
    it("calls toast.success with the documented Italian success string", async () => {
      const { user } = mount({ route: "/batch/new" });
      await user.type(fieldByLabel(/^Volume \(litri\)$/), "1000");
      await user.click(screen.getByRole("button", { name: /Salva lotto/i }));
      expect((sonnerToast.success as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        "Lotto salvato con successo",
      );
    });

    it("appends a batch to the AppDataProvider state and persists it", async () => {
      const { user } = mount({ route: "/batch/new" });
      await user.type(fieldByLabel(/^Volume \(litri\)$/), "1000");
      await user.type(fieldByLabel(/Acidità totale/), "6.5");
      await user.click(screen.getByRole("button", { name: /Salva lotto/i }));

      const stored = JSON.parse(localStorage.getItem("dop_batches") ?? "[]");
      expect(stored).toHaveLength(1);
      expect(stored[0]).toMatchObject({
        id: "uuid-1",
        date: "2026-04-15",
        volume: 1000,
        acidity: 6.5,
        hasWarnings: false,
        createdAt: "2026-04-15T10:00:00.000Z",
      });
      expect(stored[0].batchId).toMatch(/^ABM-20260415-[A-Z0-9]{4}$/);
      expect(stored[0].modifiedAt).toBeUndefined();
    });

    it("sets hasWarnings=true when the batch fails any rule on save", async () => {
      const { user } = mount({ route: "/batch/new" });
      await user.type(fieldByLabel(/Acidità totale/), "5");
      await user.click(screen.getByRole("button", { name: /Salva lotto/i }));
      const stored = JSON.parse(localStorage.getItem("dop_batches") ?? "[]");
      expect(stored[0].hasWarnings).toBe(true);
    });

    it("navigates to /home after saving", async () => {
      const { user } = mount({ route: "/batch/new" });
      await user.click(screen.getByRole("button", { name: /Salva lotto/i }));
      expect(screen.getByTestId("route-home")).toBeInTheDocument();
    });
  });
});

describe("<BatchForm /> — edit mode", () => {
  beforeEach(() => {
    freezeTime("2026-06-01T08:30:00.000Z");
    seedMathRandom([0.5]);
    seedRandomUuid("uuid");
  });

  const existing = makeBatch({
    id: "edit-target",
    batchId: "ABM-20260101-OLD1",
    date: "2026-01-01",
    supplier: "Old Supplier",
    volume: 500,
    acidity: 7,
  });

  it("prefills the form from the existing batch", () => {
    mount({ route: "/batch/edit-target", preload: { batches: [existing], onboardingComplete: true } });
    expect((fieldByLabel(/^ID Lotto$/) as HTMLInputElement).value).toBe("ABM-20260101-OLD1");
    expect((fieldByLabel(/Fornitore materia prima/) as HTMLInputElement).value).toBe("Old Supplier");
    expect((fieldByLabel(/^Volume \(litri\)$/) as HTMLInputElement).value).toBe("500");
    expect((fieldByLabel(/Acidità totale/) as HTMLInputElement).value).toBe("7");
  });

  it("shows the 'Aggiorna lotto' label, NOT 'Salva lotto'", () => {
    mount({ route: "/batch/edit-target", preload: { batches: [existing], onboardingComplete: true } });
    expect(screen.getByRole("button", { name: /Aggiorna lotto/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Salva lotto$/i })).not.toBeInTheDocument();
  });

  it("on save, sets modifiedAt to the current ISO timestamp and preserves the original id", async () => {
    const { user } = mount({
      route: "/batch/edit-target",
      preload: { batches: [existing], onboardingComplete: true },
    });
    await user.clear(fieldByLabel(/^Volume \(litri\)$/));
    await user.type(fieldByLabel(/^Volume \(litri\)$/), "999");
    await user.click(screen.getByRole("button", { name: /Aggiorna lotto/i }));

    const stored = JSON.parse(localStorage.getItem("dop_batches") ?? "[]");
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe("edit-target");
    expect(stored[0].volume).toBe(999);
    expect(stored[0].modifiedAt).toBe("2026-06-01T08:30:00.000Z");
  });
});
