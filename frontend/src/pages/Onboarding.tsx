import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, ChevronLeft, Wine, Beef, Milk, Leaf, Fish, Droplets, Check, Globe } from "lucide-react";

interface Denomination {
  id: string
  name: string
}

interface Category {
  id: string
  label: string
  icon: React.ElementType
  denominations: Denomination[]
}

const CATEGORIES: Category[] = [
  {
    id: 'formaggi',
    label: 'Formaggi',
    icon: Milk,
    denominations: [
      { id: 'asiago', name: 'Asiago DOP' },
      { id: 'bitto', name: 'Bitto DOP' },
      { id: 'casatella-trevigiana', name: 'Casatella Trevigiana DOP' },
      { id: 'fontina', name: 'Fontina DOP' },
      { id: 'gorgonzola', name: 'Gorgonzola DOP' },
      { id: 'grana-padano', name: 'Grana Padano DOP' },
      { id: 'montasio', name: 'Montasio DOP' },
      { id: 'monte-veronese', name: 'Monte Veronese DOP' },
      { id: 'nostrano-valtrompia', name: 'Nostrano Valtrompia DOP' },
      { id: 'piave', name: 'Piave DOP' },
      { id: 'provolone-valpadana', name: 'Provolone Valpadana DOP' },
      { id: 'ricotta-di-bufala-campana', name: 'Ricotta di Bufala Campana DOP' },
      { id: 'spressa-delle-giudicarie', name: 'Spressa delle Giudicarie DOP' },
      { id: 'valle-daosta-fromadzo', name: "Valle d'Aosta Fromadzo DOP" },
      { id: 'valtellina-casera', name: 'Valtellina Casera DOP' },
    ],
  },
  {
    id: 'salumi',
    label: 'Salumi',
    icon: Beef,
    denominations: [
      { id: 'bresaola-della-valtellina', name: 'Bresaola della Valtellina IGP' },
      { id: 'sopressa-vicentina', name: 'Sopressa Vicentina DOP' },
    ],
  },
  {
    id: 'vino',
    label: 'Vino',
    icon: Wine,
    denominations: [
      { id: 'chianti-classico', name: 'Chianti Classico DOP' },
      { id: 'garda', name: 'Garda DOP' },
    ],
  },
  {
    id: 'aceto',
    label: 'Aceto',
    icon: Droplets,
    denominations: [
      { id: 'aceto-balsamico-di-modena', name: 'Aceto Balsamico di Modena IGP' },
    ],
  },
  {
    id: 'ortaggi-frutta',
    label: 'Ortaggi & Frutta',
    icon: Leaf,
    denominations: [
      { id: 'aglio-bianco-polesano', name: 'Aglio Bianco Polesano IGP' },
      { id: 'amarene-brusche-di-modena', name: 'Amarene Brusche di Modena IGP' },
      { id: 'asparago-bianco-di-bassano', name: 'Asparago Bianco di Bassano IGP' },
      { id: 'asparago-bianco-di-cimadolmo', name: 'Asparago Bianco di Cimadolmo IGP' },
      { id: 'asparago-di-badoere', name: 'Asparago di Badoere IGP' },
      { id: 'ciliegia-di-marostica', name: 'Ciliegia di Marostica IGP' },
      { id: 'cipollotto-nocerino', name: 'Cipollotto Nocerino DOP' },
      { id: 'fagiolo-di-lamon-della-vallata-bellunese', name: 'Fagiolo di Lamon della Vallata Bellunese IGP' },
      { id: 'insalata-di-lusia', name: 'Insalata di Lusia IGP' },
      { id: 'marrone-di-combai', name: 'Marrone di Combai IGP' },
      { id: 'marrone-di-san-zeno', name: 'Marrone di San Zeno IGP' },
      { id: 'marroni-del-monfenera', name: 'Marroni del Monfenera IGP' },
      { id: 'mela-di-valtellina', name: 'Mela di Valtellina IGP' },
      { id: 'mela-val-di-non', name: 'Mela Val di Non DOP' },
      { id: 'melanzana-rossa-di-rotonda', name: 'Melanzana Rossa di Rotonda DOP' },
      { id: 'pera-mantovana', name: 'Pera Mantovana IGP' },
      { id: 'pesca-di-verona', name: 'Pesca di Verona IGP' },
      { id: 'radicchio-di-chioggia', name: 'Radicchio di Chioggia IGP' },
      { id: 'radicchio-di-verona', name: 'Radicchio di Verona IGP' },
      { id: 'radicchio-rosso-di-treviso', name: 'Radicchio Rosso di Treviso IGP' },
      { id: 'radicchio-variegato-di-castelfranco', name: 'Radicchio Variegato di Castelfranco IGP' },
      { id: 'susina-di-dro', name: 'Susina di Dro DOP' },
      { id: 'uva-da-tavola-di-canicatti', name: "Uva da Tavola di Canicattì IGP" },
    ],
  },
  {
    id: 'altro',
    label: 'Altro',
    icon: Fish,
    denominations: [
      { id: 'miele-delle-dolomiti-bellunesi', name: 'Miele delle Dolomiti Bellunesi DOP' },
      { id: 'salmerino-del-trentino', name: 'Salmerino del Trentino DOP' },
    ],
  },
]

export default function Onboarding() {
  const { t, toggleLang, lang } = useLanguage();
  const { setCompanyInfo, setOnboardingComplete } = useAppData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedDenom, setSelectedDenom] = useState<Denomination | null>(null);
  const [company, setCompany] = useState({ name: "", province: "", employees: "" });

  const selectedCat = CATEGORIES.find((c) => c.id === selectedCatId) ?? null

  const finish = () => {
    setCompanyInfo({
      ...company,
      denomination: selectedDenom!.name,
      denominationId: selectedDenom!.id,
    });
    setOnboardingComplete(true);
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex flex-col">
      <div className="flex justify-end p-4">
        <Button variant="ghost" size="sm" onClick={toggleLang} className="gap-1.5">
          <Globe className="h-4 w-4" />
          {lang === "it" ? "EN" : "IT"}
        </Button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        <div className="w-full max-w-2xl">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-primary w-10" : "bg-muted w-6"
                }`}
              />
            ))}
          </div>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-2">
                <Leaf className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight">{t("onboarding.welcome.title")}</h1>
              <p className="text-xl text-muted-foreground font-medium">{t("onboarding.welcome.subtitle")}</p>
              <p className="text-muted-foreground max-w-lg mx-auto">{t("onboarding.welcome.desc")}</p>
              <Button size="lg" className="mt-4 text-lg px-8" onClick={() => setStep(1)}>
                {t("onboarding.welcome.cta")} <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Step 1: Select denomination */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-bold">{t("onboarding.step2.title")}</h2>
                <p className="text-muted-foreground mt-2">{t("onboarding.step2.subtitle")}</p>
              </div>

              {/* Category grid */}
              <div className="grid grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <Card
                      key={cat.id}
                      className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                        selectedCatId === cat.id ? "border-primary ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => { setSelectedCatId(cat.id); setSelectedDenom(null); }}
                    >
                      <CardContent className="p-4 flex flex-col items-center gap-2 text-center">
                        <div className={`p-2.5 rounded-xl ${selectedCatId === cat.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-semibold">{cat.label}</span>
                        <span className="text-xs text-muted-foreground">{cat.denominations.length} prodotti</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Denomination list for selected category */}
              {selectedCat && (
                <div className="animate-in slide-in-from-bottom-4 duration-300">
                  <ScrollArea className="h-64 rounded-md border">
                    <div className="p-2 space-y-1">
                      {selectedCat.denominations.map((d) => (
                        <Card
                          key={d.id}
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            selectedDenom?.id === d.id ? "border-primary ring-2 ring-primary/20 bg-primary/5" : ""
                          }`}
                          onClick={() => setSelectedDenom(d)}
                        >
                          <CardContent className="p-3 flex items-center justify-between">
                            <span className="text-sm font-medium">{d.name}</span>
                            {selectedDenom?.id === d.id && <Check className="h-4 w-4 text-primary" />}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(0)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> {t("onboarding.back")}
                </Button>
                <Button disabled={!selectedDenom} onClick={() => setStep(2)}>
                  {t("onboarding.next")} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Company info */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="text-center">
                <h2 className="text-3xl font-bold">{t("onboarding.step3.title")}</h2>
              </div>
              <Card>
                <CardContent className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label>{t("onboarding.step3.company")}</Label>
                    <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Azienda Agricola Rossi S.r.l." />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.step3.province")}</Label>
                    <Input value={company.province} onChange={(e) => setCompany({ ...company, province: e.target.value })} placeholder="es. Modena" />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.step3.employees")}</Label>
                    <Input type="number" value={company.employees} onChange={(e) => setCompany({ ...company, employees: e.target.value })} placeholder="25" />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> {t("onboarding.back")}
                </Button>
                <Button disabled={!company.name || !company.province} onClick={() => setStep(3)}>
                  {t("onboarding.next")} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Done */}
          {step === 3 && (
            <div className="text-center space-y-6 animate-in fade-in duration-500">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-2">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="text-3xl font-bold">{t("onboarding.step4.title")}</h2>
              <p className="text-lg text-muted-foreground">
                {t("onboarding.step4.desc")} <span className="font-semibold text-foreground">{selectedDenom?.name}</span>
              </p>
              <p className="text-muted-foreground">{company.name} — {company.province}</p>
              <Button size="lg" className="mt-4 text-lg px-8" onClick={finish}>
                {t("onboarding.step4.cta")} <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
