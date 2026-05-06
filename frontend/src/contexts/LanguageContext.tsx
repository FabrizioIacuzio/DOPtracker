import React, { createContext, useContext, useState, useCallback } from "react";

type Lang = "it" | "en";

const translations = {
  // Navigation
  "nav.home": { it: "Home", en: "Home" },
  "nav.calendar": { it: "Calendario", en: "Calendar" },
  "nav.batch": { it: "Registra Lotto", en: "Log Batch" },
  "nav.dashboard": { it: "Dashboard", en: "Dashboard" },
  "nav.labReports": { it: "Rapporti Lab", en: "Lab Reports" },
  "nav.documents": { it: "Documenti", en: "Documents" },

  // Onboarding
  "onboarding.welcome.title": { it: "Gestisci la conformità DOP/IGP", en: "Manage DOP/IGP Compliance" },
  "onboarding.welcome.subtitle": { it: "Senza fogli Excel. Senza carta. Senza stress.", en: "No Excel sheets. No paper. No stress." },
  "onboarding.welcome.desc": { it: "Il tuo strumento digitale per registrare i lotti, validare i parametri e generare i documenti per gli organismi di controllo — tutto in un'unica app.", en: "Your digital tool to log batches, validate parameters, and generate documents for control bodies — all in one app." },
  "onboarding.welcome.cta": { it: "Inizia ora", en: "Get started" },
  "onboarding.step2.title": { it: "Seleziona la tua denominazione", en: "Select your denomination" },
  "onboarding.step2.subtitle": { it: "Scegli la categoria del tuo prodotto certificato", en: "Choose your certified product category" },
  "onboarding.step3.title": { it: "Informazioni aziendali", en: "Company information" },
  "onboarding.step3.company": { it: "Nome azienda", en: "Company name" },
  "onboarding.step3.province": { it: "Provincia", en: "Province" },
  "onboarding.step3.employees": { it: "Numero dipendenti", en: "Number of employees" },
  "onboarding.step4.title": { it: "Tutto pronto!", en: "All set!" },
  "onboarding.step4.desc": { it: "Il tuo account è configurato per", en: "Your account is configured for" },
  "onboarding.step4.cta": { it: "Vai alla dashboard", en: "Go to dashboard" },
  "onboarding.next": { it: "Avanti", en: "Next" },
  "onboarding.back": { it: "Indietro", en: "Back" },
  "onboarding.comingSoon": { it: "Prossimamente", en: "Coming soon" },

  // Categories
  "cat.cheese": { it: "Formaggi DOP", en: "DOP Cheeses" },
  "cat.curedMeat": { it: "Salumi DOP/IGP", en: "DOP/IGP Cured Meats" },
  "cat.vinegar": { it: "Aceto Balsamico IGP", en: "Balsamic Vinegar IGP" },
  "cat.wine": { it: "Vino DOC/DOCG", en: "DOC/DOCG Wine" },

  // Batch form
  "batch.title": { it: "Registrazione Lotto", en: "Batch Registration" },
  "batch.date": { it: "Data", en: "Date" },
  "batch.batchId": { it: "ID Lotto", en: "Batch ID" },
  "batch.supplier": { it: "Fornitore materia prima", en: "Raw material supplier" },
  "batch.volume": { it: "Volume (litri)", en: "Volume (liters)" },
  "batch.acidity": { it: "Acidità totale (%)", en: "Total acidity (%)" },
  "batch.acidityHint": { it: "Min. 6% (Art. 2 disciplinare)", en: "Min. 6% (Art. 2 specification)" },
  "batch.density": { it: "Densità a 20°C (g/ml)", en: "Density at 20°C (g/ml)" },
  "batch.densityHint": { it: "Min. 1,06 per prodotto affinato", en: "Min. 1.06 for refined product" },
  "batch.sugars": { it: "Zuccheri riduttori (g/l)", en: "Reducing sugars (g/l)" },
  "batch.sugarsHint": { it: "Min. 110 g/l", en: "Min. 110 g/l" },
  "batch.alcohol": { it: "Titolo alcolometrico (% vol)", en: "Alcohol content (% vol)" },
  "batch.alcoholHint": { it: "Max. 1,5% vol", en: "Max. 1.5% vol" },
  "batch.dryExtract": { it: "Estratto secco netto (g/l)", en: "Net dry extract (g/l)" },
  "batch.dryExtractHint": { it: "Min. 30 g/l", en: "Min. 30 g/l" },
  "batch.so2": { it: "Anidride solforosa totale (mg/l)", en: "Total sulphur dioxide (mg/l)" },
  "batch.so2Hint": { it: "Max. 100 mg/l", en: "Max. 100 mg/l" },
  "batch.ash": { it: "Ceneri (‰)", en: "Ash (‰)" },
  "batch.ashHint": { it: "Min. 2,5‰", en: "Min. 2.5‰" },
  "batch.agingMonths": { it: "Mesi di invecchiamento", en: "Aging months" },
  "batch.agingHint": { it: "Min. 60 giorni (Art. 5); 3 anni per 'invecchiato'", en: "Min. 60 days (Art. 5); 3 years for 'aged'" },
  "batch.barrelId": { it: "ID Botte", en: "Barrel ID" },
  "batch.temperature": { it: "Temperatura imbottigliamento (°C)", en: "Bottling temperature (°C)" },
  "batch.notes": { it: "Note", en: "Notes" },
  "batch.save": { it: "Salva lotto", en: "Save batch" },
  "batch.update": { it: "Aggiorna lotto", en: "Update batch" },
  "batch.saved": { it: "Lotto salvato con successo", en: "Batch saved successfully" },
  "batch.warning": { it: "Attenzione: valore fuori specifica", en: "Warning: value out of specification" },
  "batch.modified": { it: "Modificato", en: "Modified" },
  "batch.newBatch": { it: "Nuovo Lotto", en: "New Batch" },

  // Calendar
  "calendar.title": { it: "Calendario Produzione", en: "Production Calendar" },
  "calendar.logged": { it: "Registrato", en: "Logged" },
  "calendar.missing": { it: "Mancante", en: "Missing" },
  "calendar.flagged": { it: "Anomalia", en: "Flagged" },
  "calendar.dayOptions": { it: "Lotti del giorno", en: "Batches for this day" },
  "calendar.newBatch": { it: "Nuovo lotto", en: "New batch" },
  "calendar.editBatch": { it: "Modifica lotto", en: "Edit batch" },

  // Dashboard
  "dashboard.title": { it: "Dashboard", en: "Dashboard" },
  "dashboard.volume": { it: "Volume Produzione", en: "Production Volume" },
  "dashboard.acidity": { it: "Trend Acidità", en: "Acidity Trend" },
  "dashboard.compliance": { it: "Tasso di Conformità", en: "Compliance Rate" },
  "dashboard.batchesMonth": { it: "Lotti questo mese", en: "Batches this month" },
  "dashboard.nonConformity": { it: "Non conformità", en: "Non-conformities" },
  "dashboard.liters": { it: "litri", en: "liters" },

  // Lab reports
  "lab.title": { it: "Rapporti di Laboratorio", en: "Laboratory Reports" },
  "lab.upload": { it: "Carica rapporto PDF", en: "Upload PDF report" },
  "lab.dragDrop": { it: "Trascina qui il file PDF oppure clicca per selezionare", en: "Drag and drop a PDF file here or click to select" },
  "lab.date": { it: "Data", en: "Date" },
  "lab.labName": { it: "Laboratorio", en: "Laboratory" },
  "lab.status": { it: "Stato", en: "Status" },
  "lab.extracted": { it: "Valori Estratti (simulazione AI)", en: "Extracted Values (AI simulation)" },
  "lab.processed": { it: "Elaborato", en: "Processed" },
  "lab.pending": { it: "In attesa", en: "Pending" },

  // Documents
  "docs.title": { it: "Documenti di Conformità", en: "Compliance Documents" },
  "docs.period": { it: "Periodo", en: "Period" },
  "docs.status": { it: "Stato", en: "Status" },
  "docs.view": { it: "Visualizza PDF", en: "View PDF" },
  "docs.draft": { it: "Bozza", en: "Draft" },
  "docs.ready": { it: "Pronto", en: "Ready" },
  "docs.submitted": { it: "Inviato", en: "Submitted" },
  "docs.checklist": { it: "Checklist di Invio", en: "Submission Checklist" },
  "docs.checklistDesc": { it: "Segui questi passaggi per inviare la dichiarazione al portale CSQA:", en: "Follow these steps to submit the declaration to the CSQA portal:" },
  "docs.step1": { it: "Accedi al portale CSQA con le tue credenziali", en: "Log in to the CSQA portal with your credentials" },
  "docs.step2": { it: "Naviga su 'Dichiarazioni > Nuova Dichiarazione'", en: "Navigate to 'Declarations > New Declaration'" },
  "docs.step3": { it: "Allega il file PDF generato", en: "Attach the generated PDF file" },
  "docs.step4": { it: "Verifica i dati e clicca 'Invia'", en: "Verify the data and click 'Submit'" },

  // General
  "general.language": { it: "EN", en: "IT" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("it");

  const toggleLang = useCallback(() => {
    setLang((l) => (l === "it" ? "en" : "it"));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => {
      return translations[key]?.[lang] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
