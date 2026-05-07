import type { BatchEntry, CompanyInfo, LabReport } from "@/contexts/AppDataContext";

/**
 * A fully-populated, validation-passing ABM IGP batch.
 * Override individual fields per test as needed.
 */
export function makeBatch(overrides: Partial<BatchEntry> = {}): BatchEntry {
  return {
    id: "batch-id-1",
    date: "2026-05-07",
    batchId: "ABM-20260507-A1B2",
    supplier: "Cantine Modena",
    volume: 1000,
    acidity: 6.5,
    density: 1.07,
    sugars: 120,
    agingMonths: 6,
    alcohol: 1.0,
    dryExtract: 35,
    so2: 50,
    ash: 3.0,
    barrelId: "B-001",
    temperature: 18,
    notes: "",
    createdAt: "2026-05-07T12:00:00.000Z",
    hasWarnings: false,
    ...overrides,
  };
}

/**
 * A batch with one numeric field forced to a specific value, useful for
 * exercising single-rule violations in validator tests without copying the
 * full literal.
 */
export function makeBatchWith(field: keyof BatchEntry, value: number): BatchEntry {
  return makeBatch({ [field]: value } as Partial<BatchEntry>);
}

export function makeCompany(overrides: Partial<CompanyInfo> = {}): CompanyInfo {
  return {
    name: "Acetaia Test S.r.l.",
    province: "Modena",
    employees: "20",
    denomination: "Aceto Balsamico di Modena IGP",
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
