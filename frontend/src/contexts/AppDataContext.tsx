import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface BatchEntry {
  id: string;
  date: string;
  batchId: string;
  supplier: string;
  volume: number;
  acidity: number;
  density: number;
  sugars: number;
  agingMonths: number;
  alcohol: number;
  dryExtract: number;
  so2: number;
  ash: number;
  barrelId: string;
  temperature: number;
  notes: string;
  createdAt: string;
  modifiedAt?: string;
  hasWarnings: boolean;
}

export interface LabReport {
  id: string;
  fileName: string;
  labName: string;
  date: string;
  status: "pending" | "processed";
  extractedValues?: {
    acidity?: number;
    density?: number;
    sugars?: number;
    dryExtract?: number;
    ash?: number;
  };
}

export interface CompanyInfo {
  name: string;
  province: string;
  employees: string;
  denomination: string;
}

// ABM IGP validation rules
// ABM IGP validation rules — from official disciplinare Art. 2
export const ABM_RULES = {
  acidity: { min: 6, label: "Acidità totale" },
  density: { min: 1.06, label: "Densità a 20°C" },
  sugars: { min: 110, label: "Zuccheri riduttori" },
  agingMonths: { min: 2, label: "Invecchiamento (mesi)" }, // 60 days ≈ 2 months
  alcohol: { max: 1.5, label: "Titolo alcolometrico" },
  dryExtract: { min: 30, label: "Estratto secco netto" },
  so2: { max: 100, label: "Anidride solforosa totale" },
  ash: { min: 2.5, label: "Ceneri" },
};

export function validateBatch(batch: Partial<BatchEntry>): string[] {
  const warnings: string[] = [];
  if (batch.acidity !== undefined && batch.acidity > 0 && batch.acidity < ABM_RULES.acidity.min)
    warnings.push(`Acidità sotto il minimo (${ABM_RULES.acidity.min}%)`);
  if (batch.density !== undefined && batch.density > 0 && batch.density < ABM_RULES.density.min)
    warnings.push(`Densità sotto il minimo (${ABM_RULES.density.min} g/ml)`);
  if (batch.sugars !== undefined && batch.sugars > 0 && batch.sugars < ABM_RULES.sugars.min)
    warnings.push(`Zuccheri sotto il minimo (${ABM_RULES.sugars.min} g/l)`);
  if (batch.agingMonths !== undefined && batch.agingMonths > 0 && batch.agingMonths < ABM_RULES.agingMonths.min)
    warnings.push(`Invecchiamento insufficiente (min. ${ABM_RULES.agingMonths.min} mesi / 60 gg)`);
  if (batch.alcohol !== undefined && batch.alcohol > 0 && batch.alcohol > ABM_RULES.alcohol.max)
    warnings.push(`Titolo alcolometrico sopra il massimo (${ABM_RULES.alcohol.max}% vol)`);
  if (batch.dryExtract !== undefined && batch.dryExtract > 0 && batch.dryExtract < ABM_RULES.dryExtract.min)
    warnings.push(`Estratto secco netto sotto il minimo (${ABM_RULES.dryExtract.min} g/l)`);
  if (batch.so2 !== undefined && batch.so2 > 0 && batch.so2 > ABM_RULES.so2.max)
    warnings.push(`SO₂ totale sopra il massimo (${ABM_RULES.so2.max} mg/l)`);
  if (batch.ash !== undefined && batch.ash > 0 && batch.ash < ABM_RULES.ash.min)
    warnings.push(`Ceneri sotto il minimo (${ABM_RULES.ash.min}‰)`);
  return warnings;
}

interface AppDataContextType {
  companyInfo: CompanyInfo | null;
  setCompanyInfo: (info: CompanyInfo) => void;
  batches: BatchEntry[];
  addBatch: (batch: BatchEntry) => void;
  updateBatch: (id: string, batch: Partial<BatchEntry>) => void;
  getBatchesByDate: (date: string) => BatchEntry[];
  labReports: LabReport[];
  addLabReport: (report: LabReport) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
}

const AppDataContext = createContext<AppDataContextType | null>(null);

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo | null>(
    () => loadFromStorage("dop_company", null)
  );
  const [batches, setBatches] = useState<BatchEntry[]>(
    () => loadFromStorage("dop_batches", [])
  );
  const [labReports, setLabReports] = useState<LabReport[]>(
    () => loadFromStorage("dop_labReports", [])
  );
  const [onboardingComplete, setOnboardingCompleteState] = useState(
    () => loadFromStorage("dop_onboarded", false)
  );

  useEffect(() => { localStorage.setItem("dop_company", JSON.stringify(companyInfo)); }, [companyInfo]);
  useEffect(() => { localStorage.setItem("dop_batches", JSON.stringify(batches)); }, [batches]);
  useEffect(() => { localStorage.setItem("dop_labReports", JSON.stringify(labReports)); }, [labReports]);
  useEffect(() => { localStorage.setItem("dop_onboarded", JSON.stringify(onboardingComplete)); }, [onboardingComplete]);

  const setCompanyInfo = useCallback((info: CompanyInfo) => setCompanyInfoState(info), []);
  const setOnboardingComplete = useCallback((v: boolean) => setOnboardingCompleteState(v), []);

  const addBatch = useCallback((batch: BatchEntry) => {
    setBatches((prev) => [...prev, batch]);
  }, []);

  const updateBatch = useCallback((id: string, updates: Partial<BatchEntry>) => {
    setBatches((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, ...updates, modifiedAt: new Date().toISOString() } : b
      )
    );
  }, []);

  const getBatchesByDate = useCallback(
    (date: string) => batches.filter((b) => b.date === date),
    [batches]
  );

  const addLabReport = useCallback((report: LabReport) => {
    setLabReports((prev) => [...prev, report]);
  }, []);

  return (
    <AppDataContext.Provider
      value={{
        companyInfo, setCompanyInfo, batches, addBatch, updateBatch,
        getBatchesByDate, labReports, addLabReport, onboardingComplete, setOnboardingComplete,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
