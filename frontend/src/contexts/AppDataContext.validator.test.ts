import { describe, it, expect } from "vitest";
import { validateDenominationFields, getDenominationConfig } from "@/lib/denominationFields";

const ABM = "aceto-balsamico-di-modena";
const GORGONZOLA = "gorgonzola";
const GRANA_PADANO = "grana-padano";
const INSALATA_DI_LUSIA = "insalata-di-lusia";

function validate(fields: Record<string, string | number>) {
  return validateDenominationFields(ABM, fields);
}

function validateGorgonzola(fields: Record<string, string | number>) {
  return validateDenominationFields(GORGONZOLA, fields);
}

function validateGranaPadano(fields: Record<string, string | number>) {
  return validateDenominationFields(GRANA_PADANO, fields);
}

function validateInsalataDiLusia(fields: Record<string, string | number>) {
  return validateDenominationFields(INSALATA_DI_LUSIA, fields);
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

  describe("product type thresholds", () => {
    it("uses the 2025 invecchiato density and acidity thresholds", () => {
      const result = validate({
        productType: "invecchiato",
        density: 1.14,
        acidity: 5.5,
        agingMonths: 36,
      });

      expect(result).toEqual(["Densità sotto il minimo (1.15 g/ml)"]);
    });

    it("uses the 2025 riserva density and aging thresholds", () => {
      const result = validate({
        productType: "riserva",
        density: 1.24,
        acidity: 5.5,
        agingMonths: 59.99,
      });

      expect(result).toEqual([
        "Densità sotto il minimo (1.25 g/ml)",
        "Invecchiamento sotto il minimo (60 mesi)",
      ]);
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
  it("exposes the 2025 ABM thresholds by product type (pin against accidental edits)", () => {
    const config = getDenominationConfig(ABM);
    const ruleFor = (field: string, productType?: string) =>
      config.rules.find((rule) => {
        if (rule.field !== field) return false;
        if (productType === undefined) return rule.when === undefined;
        const equals = rule.when?.equals;
        return Array.isArray(equals) ? equals.includes(productType) : equals === productType;
      });

    expect(config.fields.find((field) => field.key === "productType")?.options).toEqual([
      "affinato", "invecchiato", "riserva",
    ]);
    expect(ruleFor('acidity', 'affinato')?.min).toBe(6);
    expect(ruleFor('acidity', 'invecchiato')?.min).toBe(5.5);
    expect(ruleFor('acidity', 'riserva')?.min).toBe(5.5);
    expect(ruleFor('density', 'affinato')?.min).toBe(1.06);
    expect(ruleFor('density', 'invecchiato')?.min).toBe(1.15);
    expect(ruleFor('density', 'riserva')?.min).toBe(1.25);
    expect(ruleFor('agingMonths', 'affinato')?.min).toBe(2);
    expect(ruleFor('agingMonths', 'invecchiato')?.min).toBe(36);
    expect(ruleFor('agingMonths', 'riserva')?.min).toBe(60);
    expect(ruleFor('sugars')?.min).toBe(110);
    expect(ruleFor('alcohol')?.max).toBe(1.5);
    expect(ruleFor('dryExtract')?.min).toBe(30);
    expect(ruleFor('so2')?.max).toBe(100);
    expect(ruleFor('ash')?.min).toBe(2.5);
  });
});

describe("validateDenominationFields — Gorgonzola DOP rules", () => {
  it("exposes all three official product types", () => {
    const config = getDenominationConfig(GORGONZOLA);
    const variety = config.fields.find((field) => field.key === "variety");

    expect(variety?.options).toEqual(["dolce", "piccante", "piccola_piccante"]);
  });

  it("flags piccante wheels aged below 80 days", () => {
    expect(validateGorgonzola({
      variety: "piccante",
      aging_days: 79,
    })).toContain("Giorni stagionatura (piccante) sotto il minimo (80 giorni)");
  });

  it("flags dolce wheels aged above 150 days", () => {
    expect(validateGorgonzola({
      variety: "dolce",
      aging_days: 151,
    })).toContain("Giorni stagionatura (dolce) sopra il massimo (150 giorni)");
  });

  it("accepts piccola piccante wheels at the 5.5 kg lower boundary", () => {
    expect(validateGorgonzola({
      variety: "piccola_piccante",
      wheel_weight_kg: 5.5,
    })).toEqual([]);
  });

  it("flags piccola piccante wheels at 9 kg because the upper bound is exclusive", () => {
    expect(validateGorgonzola({
      variety: "piccola_piccante",
      wheel_weight_kg: 9,
    })).toContain("Peso forma (piccola piccante) deve essere inferiore a 9 kg");
  });
});

describe("validateDenominationFields - Grana Padano DOP rules", () => {
  it("exposes standard and Riserva product types", () => {
    const config = getDenominationConfig(GRANA_PADANO);
    const productType = config.fields.find((field) => field.key === "product_type");

    expect(productType?.options).toEqual(["standard", "riserva"]);
    expect(productType?.defaultValue).toBe("standard");
  });

  it("uses the official 32% fat on dry matter minimum", () => {
    expect(validateGranaPadano({ fat_on_dry_matter_percent: 32 })).toEqual([]);
    expect(validateGranaPadano({ fat_on_dry_matter_percent: 31.99 })).toContain(
      "Grasso sulla sostanza secca sotto il minimo (32 %)",
    );
  });

  it("flags standard wheels aged below 9 months", () => {
    expect(validateGranaPadano({ product_type: "standard", aging_months: 8.99 })).toContain(
      "Mesi stagionatura (standard) sotto il minimo (9 mesi)",
    );
  });

  it("flags Riserva wheels aged below 20 months", () => {
    expect(validateGranaPadano({ product_type: "riserva", aging_months: 19.99 })).toContain(
      "Mesi stagionatura (Riserva) sotto il minimo (20 mesi)",
    );
  });

  it("keeps the official 24-40 kg wheel-weight boundaries", () => {
    expect(validateGranaPadano({ wheel_weight_kg: 24 })).toEqual([]);
    expect(validateGranaPadano({ wheel_weight_kg: 40 })).toEqual([]);
    expect(validateGranaPadano({ wheel_weight_kg: 23.99 })).toContain("Peso forma sotto il minimo (24 kg)");
    expect(validateGranaPadano({ wheel_weight_kg: 40.01 })).toContain("Peso forma sopra il massimo (40 kg)");
  });
});

describe("validateDenominationFields - Insalata di Lusia IGP rules", () => {
  it("exposes only the official Cappuccia and Gentile varieties", () => {
    const config = getDenominationConfig(INSALATA_DI_LUSIA);
    const variety = config.fields.find((field) => field.key === "variety");

    expect(variety?.options).toEqual(["cappuccia", "gentile"]);
    expect(variety?.defaultValue).toBe("cappuccia");
  });

  it("uses the Cappuccia head-weight range of 200-500 g", () => {
    expect(validateInsalataDiLusia({ variety: "cappuccia", avg_head_weight_g: 200 })).toEqual([]);
    expect(validateInsalataDiLusia({ variety: "cappuccia", avg_head_weight_g: 500 })).toEqual([]);
    expect(validateInsalataDiLusia({ variety: "cappuccia", avg_head_weight_g: 199.99 })).toContain(
      "Peso medio cespo (Cappuccia) sotto il minimo (200 g)",
    );
    expect(validateInsalataDiLusia({ variety: "cappuccia", avg_head_weight_g: 500.01 })).toContain(
      "Peso medio cespo (Cappuccia) sopra il massimo (500 g)",
    );
  });

  it("uses the Gentile head-weight range of 150-450 g", () => {
    expect(validateInsalataDiLusia({ variety: "gentile", avg_head_weight_g: 150 })).toEqual([]);
    expect(validateInsalataDiLusia({ variety: "gentile", avg_head_weight_g: 450 })).toEqual([]);
    expect(validateInsalataDiLusia({ variety: "gentile", avg_head_weight_g: 149.99 })).toContain(
      "Peso medio cespo (Gentile) sotto il minimo (150 g)",
    );
    expect(validateInsalataDiLusia({ variety: "gentile", avg_head_weight_g: 450.01 })).toContain(
      "Peso medio cespo (Gentile) sopra il massimo (450 g)",
    );
  });

  it("flags stems above the 6 cm maximum", () => {
    expect(validateInsalataDiLusia({ stem_length_cm: 6 })).toEqual([]);
    expect(validateInsalataDiLusia({ stem_length_cm: 6.01 })).toContain("Fusto sopra il massimo (6 cm)");
  });

  it("applies variety-specific maximum yield per hectare per cycle", () => {
    expect(validateInsalataDiLusia({ variety: "cappuccia", yield_t_per_ha: 55 })).toEqual([]);
    expect(validateInsalataDiLusia({ variety: "gentile", yield_t_per_ha: 50 })).toEqual([]);
    expect(validateInsalataDiLusia({ variety: "cappuccia", yield_t_per_ha: 55.01 })).toContain(
      "Resa per ettaro/ciclo (Cappuccia) sopra il massimo (55 t/ha)",
    );
    expect(validateInsalataDiLusia({ variety: "gentile", yield_t_per_ha: 50.01 })).toContain(
      "Resa per ettaro/ciclo (Gentile) sopra il massimo (50 t/ha)",
    );
  });
});
