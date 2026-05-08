import { describe, it, expect } from "vitest";
import { validateDenominationFields, getDenominationConfig } from "@/lib/denominationFields";

const ABM = "aceto-balsamico-di-modena";

function validate(fields: Record<string, string | number>) {
  return validateDenominationFields(ABM, fields);
}

describe("validateDenominationFields — ABM IGP rules", () => {
  describe("empty / partial input", () => {
    it("returns no warnings for an empty field map", () => {
      expect(validate({})).toEqual([]);
    });

    it("returns no warnings when every numeric field is zero (guard: > 0)", () => {
      expect(validate({
        acidity: 0, density: 0, sugars: 0, agingMonths: 0,
        alcohol: 0, dryExtract: 0, so2: 0, ash: 0,
      })).toEqual([]);
    });

    it("returns no warnings for a fully compliant batch", () => {
      expect(validate({
        acidity: 6.5, density: 1.07, sugars: 120, agingMonths: 6,
        alcohol: 1.0, dryExtract: 35, so2: 50, ash: 3.0,
      })).toEqual([]);
    });
  });

  describe("acidity (min 6 %)", () => {
    it("passes at the boundary (6.0)", () => {
      expect(validate({ acidity: 6 })).toEqual([]);
    });

    it("flags one ulp below boundary (5.99)", () => {
      expect(validate({ acidity: 5.99 })).toContain("Acidità totale sotto il minimo (6 %)");
    });

    it("flags deeply violating values once, no duplication", () => {
      const result = validate({ acidity: 1 });
      expect(result.filter((w) => w.includes("Acidità totale"))).toHaveLength(1);
    });
  });

  describe("density (min 1.06 g/ml)", () => {
    it("passes at the boundary (1.06)", () => {
      expect(validate({ density: 1.06 })).toEqual([]);
    });

    it("flags one ulp below boundary (1.0599)", () => {
      expect(validate({ density: 1.0599 })).toContain("Densità sotto il minimo (1.06 g/ml)");
    });
  });

  describe("sugars (min 110 g/L)", () => {
    it("passes at the boundary (110)", () => {
      expect(validate({ sugars: 110 })).toEqual([]);
    });

    it("flags one ulp below boundary (109.99)", () => {
      expect(validate({ sugars: 109.99 })).toContain("Zuccheri riduttori sotto il minimo (110 g/L)");
    });
  });

  describe("agingMonths (min 2 mesi)", () => {
    it("passes at the boundary (2)", () => {
      expect(validate({ agingMonths: 2 })).toEqual([]);
    });

    it("flags fractional violation (1.999)", () => {
      expect(validate({ agingMonths: 1.999 })).toContain("Invecchiamento sotto il minimo (2 mesi)");
    });
  });

  describe("alcohol (max 1.5 % vol)", () => {
    it("passes at the boundary (1.5)", () => {
      expect(validate({ alcohol: 1.5 })).toEqual([]);
    });

    it("flags one ulp above boundary (1.51)", () => {
      expect(validate({ alcohol: 1.51 })).toContain("Titolo alcolometrico sopra il massimo (1.5 % vol)");
    });
  });

  describe("dryExtract (min 30 g/L)", () => {
    it("passes at the boundary (30)", () => {
      expect(validate({ dryExtract: 30 })).toEqual([]);
    });

    it("flags one ulp below boundary (29.99)", () => {
      expect(validate({ dryExtract: 29.99 })).toContain("Estratto secco netto sotto il minimo (30 g/L)");
    });
  });

  describe("so2 (max 100 mg/L)", () => {
    it("passes at the boundary (100)", () => {
      expect(validate({ so2: 100 })).toEqual([]);
    });

    it("flags one ulp above boundary (100.01)", () => {
      expect(validate({ so2: 100.01 })).toContain("SO₂ totale sopra il massimo (100 mg/L)");
    });
  });

  describe("ash (min 2.5 ‰)", () => {
    it("passes at the boundary (2.5)", () => {
      expect(validate({ ash: 2.5 })).toEqual([]);
    });

    it("flags one ulp below boundary (2.49)", () => {
      expect(validate({ ash: 2.49 })).toContain("Ceneri sotto il minimo (2.5 ‰)");
    });
  });

  describe("multiple violations", () => {
    it("returns warnings for both fields when two rules fail", () => {
      const result = validate({ acidity: 5, density: 1.0 });
      expect(result.some((w) => w.includes("Acidità totale"))).toBe(true);
      expect(result.some((w) => w.includes("Densità"))).toBe(true);
    });

    it("returns exactly 8 warnings when every rule fails", () => {
      const result = validate({
        acidity: 1, density: 1.0, sugars: 1, agingMonths: 1,
        alcohol: 99, dryExtract: 1, so2: 999, ash: 1,
      });
      expect(result).toHaveLength(8);
    });
  });
});

describe("getDenominationConfig — ABM rule thresholds", () => {
  it("exposes the canonical ABM thresholds (pin against accidental edits)", () => {
    const config = getDenominationConfig(ABM);
    const byField = Object.fromEntries(config.rules.map((r) => [r.field, r]));
    expect(byField['acidity']?.min).toBe(6);
    expect(byField['density']?.min).toBe(1.06);
    expect(byField['sugars']?.min).toBe(110);
    expect(byField['agingMonths']?.min).toBe(2);
    expect(byField['alcohol']?.max).toBe(1.5);
    expect(byField['dryExtract']?.min).toBe(30);
    expect(byField['so2']?.max).toBe(100);
    expect(byField['ash']?.min).toBe(2.5);
  });
});
