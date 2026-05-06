import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, Wine, Beef, Milk, GrapeIcon, Check, Globe } from "lucide-react";

const categories = [
  { id: "cheese", icon: Milk, denominations: ["Gorgonzola DOP", "Pecorino Toscano DOP", "Asiago DOP", "Taleggio DOP"] },
  { id: "curedMeat", icon: Beef, denominations: ["Bresaola della Valtellina IGP", "Prosciutto di Modena DOP", "Mortadella Bologna IGP"] },
  { id: "vinegar", icon: Wine, denominations: ["Aceto Balsamico di Modena IGP"] },
  { id: "wine", icon: GrapeIcon, denominations: ["Chianti Classico DOCG", "Barolo DOCG", "Prosecco DOC"] },
] as const;

type CatId = typeof categories[number]["id"];

export default function Onboarding() {
  const { t, toggleLang, lang } = useLanguage();
  const { setCompanyInfo, setOnboardingComplete } = useAppData();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedCat, setSelectedCat] = useState<CatId | null>(null);
  const [selectedDenom, setSelectedDenom] = useState<string | null>(null);
  const [company, setCompany] = useState({ name: "", province: "", employees: "" });

  const isABM = (d: string) => d === "Aceto Balsamico di Modena IGP";

  const finish = () => {
    setCompanyInfo({ ...company, denomination: selectedDenom! });
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
                <Wine className="h-10 w-10 text-primary" />
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

              <div className="grid grid-cols-2 gap-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const catKey = `cat.${cat.id}` as any;
                  return (
                    <Card
                      key={cat.id}
                      className={`cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${
                        selectedCat === cat.id ? "border-primary ring-2 ring-primary/20" : ""
                      }`}
                      onClick={() => { setSelectedCat(cat.id); setSelectedDenom(null); }}
                    >
                      <CardContent className="p-5 flex flex-col items-center gap-3 text-center">
                        <div className={`p-3 rounded-xl ${selectedCat === cat.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <span className="font-semibold">{t(catKey)}</span>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {selectedCat && (
                <div className="space-y-2 mt-4 animate-in slide-in-from-bottom-4 duration-300">
                  {categories.find((c) => c.id === selectedCat)!.denominations.map((d) => (
                    <Card
                      key={d}
                      className={`cursor-pointer transition-all ${
                        !isABM(d) ? "opacity-60" : "hover:border-primary/50"
                      } ${selectedDenom === d ? "border-primary ring-2 ring-primary/20" : ""}`}
                      onClick={() => isABM(d) && setSelectedDenom(d)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <span className="font-medium">{d}</span>
                        {isABM(d) ? (
                          selectedDenom === d && <Check className="h-5 w-5 text-primary" />
                        ) : (
                          <Badge variant="secondary" className="text-xs">{t("onboarding.comingSoon")}</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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
                    <Input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} placeholder="Acetaia Rossi S.r.l." />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("onboarding.step3.province")}</Label>
                    <Input value={company.province} onChange={(e) => setCompany({ ...company, province: e.target.value })} placeholder="Modena" />
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
                {t("onboarding.step4.desc")} <span className="font-semibold text-foreground">{selectedDenom}</span>
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
