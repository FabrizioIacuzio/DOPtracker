import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface BatchEntry {
  id: string;
  date: string;
  batchId: string;
  denominationId: string;
  fields: Record<string, string | number>;
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
  denominationId: string;
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
