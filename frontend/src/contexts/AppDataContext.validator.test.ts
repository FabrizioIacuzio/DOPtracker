import { describe, it, expect } from "vitest";
import { ABM_RULES, validateBatch } from "./AppDataContext";

/**
 * Compliance-critical: every rule of the ABM IGP disciplinare encoded in
 * validateBatch is pinned here. Boundary triplets (above / at / below) are
 * the most common compliance bug class — they each get their own assertion.
 *
 * Validation messages are documented verbatim so a typo in the source goes red.
 */
describe("validateBatch — ABM IGP rules", () => {
  describe("empty / partial input", () => {
    it("returns no warnings for an empty batch", () => {
      expect(validateBatch({})).toEqual([]);
    });

    it("returns no warnings when every numeric field is exactly zero (current guard: > 0)", () => {
      // The source uses `value > 0` as a precondition — a literal zero
      // bypasses every rule. This is pinned, not endorsed; see KNOWN_ISSUES.md.
      expect(
        validateBatch({
          acidity: 0,
          density: 0,
          sugars: 0,
          agingMonths: 0,
          alcohol: 0,
          dryExtract: 0,
          so2: 0,
          ash: 0,
        }),
      ).toEqual([]);
    });

    it("returns no warnings for a fully compliant batch", () => {
      expect(
        validateBatch({
          acidity: 6.5,
          density: 1.07,
          sugars: 120,
          agingMonths: 6,
          alcohol: 1.0,
          dryExtract: 35,
          so2: 50,
          ash: 3.0,
        }),
      ).toEqual([]);
    });
  });

  describe("acidity (min 6%)", () => {
    it("passes at the boundary (6.0)", () => {
      expect(validateBatch({ acidity: 6 })).toEqual([]);
    });

    it("flags one ulp below boundary (5.99)", () => {
      expect(validateBatch({ acidity: 5.99 })).toEqual(["Acidità sotto il minimo (6%)"]);
    });

    it("flags deeply violating values once, no duplication", () => {
      expect(validateBatch({ acidity: 1 })).toEqual(["Acidità sotto il minimo (6%)"]);
    });
  });

  describe("density (min 1.06 g/ml)", () => {
    it("passes at the boundary (1.06)", () => {
      expect(validateBatch({ density: 1.06 })).toEqual([]);
    });

    it("flags one ulp below boundary (1.0599)", () => {
      expect(validateBatch({ density: 1.0599 })).toEqual([
        "Densità sotto il minimo (1.06 g/ml)",
      ]);
    });
  });

  describe("sugars (min 110 g/l)", () => {
    it("passes at the boundary (110)", () => {
      expect(validateBatch({ sugars: 110 })).toEqual([]);
    });

    it("flags one ulp below boundary (109.99)", () => {
      expect(validateBatch({ sugars: 109.99 })).toEqual([
        "Zuccheri sotto il minimo (110 g/l)",
      ]);
    });
  });

  describe("agingMonths (min 2 ≈ 60 days)", () => {
    it("passes at the boundary (2)", () => {
      expect(validateBatch({ agingMonths: 2 })).toEqual([]);
    });

    it("flags fractional violation (1.999)", () => {
      expect(validateBatch({ agingMonths: 1.999 })).toEqual([
        "Invecchiamento insufficiente (min. 2 mesi / 60 gg)",
      ]);
    });
  });

  describe("alcohol (max 1.5% vol)", () => {
    it("passes at the boundary (1.5)", () => {
      expect(validateBatch({ alcohol: 1.5 })).toEqual([]);
    });

    it("flags one ulp above boundary (1.51)", () => {
      expect(validateBatch({ alcohol: 1.51 })).toEqual([
        "Titolo alcolometrico sopra il massimo (1.5% vol)",
      ]);
    });
  });

  describe("dryExtract (min 30 g/l)", () => {
    it("passes at the boundary (30)", () => {
      expect(validateBatch({ dryExtract: 30 })).toEqual([]);
    });

    it("flags one ulp below boundary (29.99)", () => {
      expect(validateBatch({ dryExtract: 29.99 })).toEqual([
        "Estratto secco netto sotto il minimo (30 g/l)",
      ]);
    });
  });

  describe("so2 (max 100 mg/l)", () => {
    it("passes at the boundary (100)", () => {
      expect(validateBatch({ so2: 100 })).toEqual([]);
    });

    it("flags one ulp above boundary (100.01)", () => {
      expect(validateBatch({ so2: 100.01 })).toEqual([
        "SO₂ totale sopra il massimo (100 mg/l)",
      ]);
    });
  });

  describe("ash (min 2.5‰)", () => {
    it("passes at the boundary (2.5)", () => {
      expect(validateBatch({ ash: 2.5 })).toEqual([]);
    });

    it("flags one ulp below boundary (2.49)", () => {
      expect(validateBatch({ ash: 2.49 })).toEqual(["Ceneri sotto il minimo (2.5‰)"]);
    });
  });

  describe("multiple violations", () => {
    it("returns warnings in source order when two rules fail", () => {
      expect(validateBatch({ acidity: 5, density: 1.0 })).toEqual([
        "Acidità sotto il minimo (6%)",
        "Densità sotto il minimo (1.06 g/ml)",
      ]);
    });

    it("returns exactly 8 warnings when every rule fails", () => {
      const result = validateBatch({
        acidity: 1,
        density: 1.0,
        sugars: 1,
        agingMonths: 1,
        alcohol: 99,
        dryExtract: 1,
        so2: 999,
        ash: 1,
      });
      expect(result).toHaveLength(8);
    });

    it("preserves source ordering across all 8 violations", () => {
      const result = validateBatch({
        acidity: 1,
        density: 1.0,
        sugars: 1,
        agingMonths: 1,
        alcohol: 99,
        dryExtract: 1,
        so2: 999,
        ash: 1,
      });
      expect(result).toEqual([
        "Acidità sotto il minimo (6%)",
        "Densità sotto il minimo (1.06 g/ml)",
        "Zuccheri sotto il minimo (110 g/l)",
        "Invecchiamento insufficiente (min. 2 mesi / 60 gg)",
        "Titolo alcolometrico sopra il massimo (1.5% vol)",
        "Estratto secco netto sotto il minimo (30 g/l)",
        "SO₂ totale sopra il massimo (100 mg/l)",
        "Ceneri sotto il minimo (2.5‰)",
      ]);
    });
  });
});

describe("ABM_RULES exported constants", () => {
  it("exposes the canonical thresholds (pin against accidental edits)", () => {
    expect(ABM_RULES.acidity.min).toBe(6);
    expect(ABM_RULES.density.min).toBe(1.06);
    expect(ABM_RULES.sugars.min).toBe(110);
    expect(ABM_RULES.agingMonths.min).toBe(2);
    expect(ABM_RULES.alcohol.max).toBe(1.5);
    expect(ABM_RULES.dryExtract.min).toBe(30);
    expect(ABM_RULES.so2.max).toBe(100);
    expect(ABM_RULES.ash.min).toBe(2.5);
  });

  it("exposes Italian labels matching the disciplinare", () => {
    expect(ABM_RULES.acidity.label).toBe("Acidità totale");
    expect(ABM_RULES.density.label).toBe("Densità a 20°C");
    expect(ABM_RULES.sugars.label).toBe("Zuccheri riduttori");
    expect(ABM_RULES.agingMonths.label).toBe("Invecchiamento (mesi)");
    expect(ABM_RULES.alcohol.label).toBe("Titolo alcolometrico");
    expect(ABM_RULES.dryExtract.label).toBe("Estratto secco netto");
    expect(ABM_RULES.so2.label).toBe("Anidride solforosa totale");
    expect(ABM_RULES.ash.label).toBe("Ceneri");
  });
});
