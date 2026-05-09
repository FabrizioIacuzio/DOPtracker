export type LabAnalysisStatus = "requires_validation";

interface LabAnalysisRequirement {
  denominationId: string;
  status: LabAnalysisStatus;
  statusLabel: string;
  summary: string;
  evidence: string[];
}

const requirements: Record<string, LabAnalysisRequirement> = {
  "aceto-balsamico-di-modena": {
    denominationId: "aceto-balsamico-di-modena",
    status: "requires_validation",
    statusLabel: "Da validare",
    summary: "Parametri analitici presenti nel disciplinare; obbligo, frequenza e allegazione del rapporto lab devono essere confermati nel DPC CSQA.",
    evidence: ["Disciplinare ABM", "CSQA DPC030"],
  },
  "bresaola-della-valtellina": {
    denominationId: "bresaola-della-valtellina",
    status: "requires_validation",
    statusLabel: "Da validare",
    summary: "Il disciplinare contiene caratteristiche chimiche e chimico-fisiche; non e ancora validato se il produttore debba caricare un rapporto per ogni lotto.",
    evidence: ["Disciplinare Bresaola della Valtellina IGP", "CSQA control-body page"],
  },
  gorgonzola: {
    denominationId: "gorgonzola",
    status: "requires_validation",
    statusLabel: "Da validare",
    summary: "La configurazione include soglie di prodotto; l'obbligatorieta dei rapporti di laboratorio per lotto va verificata nel piano controlli CSQA.",
    evidence: ["Disciplinare Gorgonzola DOP", "CSQA DPC012"],
  },
  "grana-padano": {
    denominationId: "grana-padano",
    status: "requires_validation",
    statusLabel: "Da validare",
    summary: "Il piano controlli distingue autocontrollo, controlli e valutazioni; caricamento lab e frequenza non sono ancora modellati.",
    evidence: ["Disciplinare Grana Padano DOP", "CSQA DPC001"],
  },
  "mozzarella-di-bufala-campana": {
    denominationId: "mozzarella-di-bufala-campana",
    status: "requires_validation",
    statusLabel: "Da validare",
    summary: "RINA e MASAF richiamano tracciabilita e controlli; non e validato che ogni lotto richieda un rapporto di laboratorio caricato dall'utente.",
    evidence: ["RINA registro di produzione", "MASAF tracciabilita latte bufalino"],
  },
};

export function getLabAnalysisRequirement(denominationId: string): LabAnalysisRequirement {
  return requirements[denominationId] ?? {
    denominationId,
    status: "requires_validation",
    statusLabel: "Da validare",
    summary: "Obbligo e frequenza dei rapporti di laboratorio non sono ancora stati validati per questa denominazione.",
    evidence: [],
  };
}
