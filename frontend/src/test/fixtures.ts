import type { BatchEntry, CompanyInfo, LabReport } from "@/contexts/AppDataContext";

type ABMFieldShortcuts = {
  volume?: number
  acidity?: number
  density?: number
  sugars?: number
  agingMonths?: number
  alcohol?: number
  dryExtract?: number
  so2?: number
  ash?: number
  barrelId?: string
  temperature?: number
  supplier?: string
}

export function makeBatch(
  overrides: Partial<BatchEntry> & ABMFieldShortcuts = {},
): BatchEntry {
  const {
    volume, acidity, density, sugars, agingMonths, alcohol,
    dryExtract, so2, ash, barrelId, temperature, supplier,
    ...batchOverrides
  } = overrides

  return {
    id: "batch-id-1",
    date: "2026-05-07",
    batchId: "ABM-20260507-A1B2",
    denominationId: "aceto-balsamico-di-modena",
    fields: {
      supplier: supplier ?? "Cantine Modena",
      volume: volume ?? 1000,
      acidity: acidity ?? 6.5,
      density: density ?? 1.07,
      sugars: sugars ?? 120,
      agingMonths: agingMonths ?? 6,
      alcohol: alcohol ?? 1.0,
      dryExtract: dryExtract ?? 35,
      so2: so2 ?? 50,
      ash: ash ?? 3.0,
      barrelId: barrelId ?? "B-001",
      temperature: temperature ?? 18,
    },
    notes: "",
    createdAt: "2026-05-07T12:00:00.000Z",
    hasWarnings: false,
    ...batchOverrides,
  };
}

export function makeCompany(overrides: Partial<CompanyInfo> = {}): CompanyInfo {
  return {
    name: "Acetaia Test S.r.l.",
    province: "Modena",
    employees: "20",
    denomination: "Aceto Balsamico di Modena IGP",
    denominationId: "aceto-balsamico-di-modena",
    ...overrides,
  };
}

export function makeLabReport(overrides: Partial<LabReport> = {}): LabReport {
  return {
    id: "lab-id-1",
    fileName: "report.pdf",
    labName: "Laboratorio Analisi Modena",
    date: "2026-05-07",
    status: "processed",
    extractedValues: { acidity: 6.8, density: 1.24, sugars: 145, dryExtract: 30.2, ash: 0.8 },
    ...overrides,
  };
}
