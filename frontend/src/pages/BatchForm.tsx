import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData, validateBatch, type BatchEntry } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function generateBatchId() {
  const now = new Date();
  return `ABM-${format(now, "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
}

export default function BatchForm() {
  const { t } = useLanguage();
  const { addBatch, updateBatch, batches } = useAppData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();

  const existingBatch = id ? batches.find((b) => b.id === id) : null;
  const prefillDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const [form, setForm] = useState({
    date: existingBatch?.date || prefillDate,
    batchId: existingBatch?.batchId || generateBatchId(),
    supplier: existingBatch?.supplier || "",
    volume: existingBatch?.volume?.toString() || "",
    acidity: existingBatch?.acidity?.toString() || "",
    density: existingBatch?.density?.toString() || "",
    sugars: existingBatch?.sugars?.toString() || "",
    agingMonths: existingBatch?.agingMonths?.toString() || "",
    alcohol: existingBatch?.alcohol?.toString() || "",
    dryExtract: existingBatch?.dryExtract?.toString() || "",
    so2: existingBatch?.so2?.toString() || "",
    ash: existingBatch?.ash?.toString() || "",
    barrelId: existingBatch?.barrelId || "",
    temperature: existingBatch?.temperature?.toString() || "",
    notes: existingBatch?.notes || "",
  });

  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const w = validateBatch({
      acidity: parseFloat(form.acidity) || undefined,
      density: parseFloat(form.density) || undefined,
      sugars: parseFloat(form.sugars) || undefined,
      agingMonths: parseFloat(form.agingMonths) || undefined,
      alcohol: parseFloat(form.alcohol) || undefined,
      dryExtract: parseFloat(form.dryExtract) || undefined,
      so2: parseFloat(form.so2) || undefined,
      ash: parseFloat(form.ash) || undefined,
    });
    setWarnings(w);
  }, [form.acidity, form.density, form.sugars, form.agingMonths, form.alcohol, form.dryExtract, form.so2, form.ash]);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSave = () => {
    const entry: BatchEntry = {
      id: existingBatch?.id || crypto.randomUUID(),
      date: form.date,
      batchId: form.batchId,
      supplier: form.supplier,
      volume: parseFloat(form.volume) || 0,
      acidity: parseFloat(form.acidity) || 0,
      density: parseFloat(form.density) || 0,
      sugars: parseFloat(form.sugars) || 0,
      agingMonths: parseFloat(form.agingMonths) || 0,
      alcohol: parseFloat(form.alcohol) || 0,
      dryExtract: parseFloat(form.dryExtract) || 0,
      so2: parseFloat(form.so2) || 0,
      ash: parseFloat(form.ash) || 0,
      barrelId: form.barrelId,
      temperature: parseFloat(form.temperature) || 0,
      notes: form.notes,
      createdAt: existingBatch?.createdAt || new Date().toISOString(),
      modifiedAt: existingBatch ? new Date().toISOString() : undefined,
      hasWarnings: warnings.length > 0,
    };

    if (existingBatch) {
      updateBatch(existingBatch.id, entry);
    } else {
      addBatch(entry);
    }
    toast.success(t("batch.saved"));
    navigate("/home");
  };

  const fields: { key: string; label: string; hint?: string; type?: string }[] = [
    { key: "date", label: t("batch.date"), type: "date" },
    { key: "batchId", label: t("batch.batchId") },
    { key: "supplier", label: t("batch.supplier") },
    { key: "volume", label: t("batch.volume"), type: "number" },
    { key: "acidity", label: t("batch.acidity"), hint: t("batch.acidityHint"), type: "number" },
    { key: "density", label: t("batch.density"), hint: t("batch.densityHint"), type: "number" },
    { key: "sugars", label: t("batch.sugars"), hint: t("batch.sugarsHint"), type: "number" },
    { key: "alcohol", label: t("batch.alcohol"), hint: t("batch.alcoholHint"), type: "number" },
    { key: "dryExtract", label: t("batch.dryExtract"), hint: t("batch.dryExtractHint"), type: "number" },
    { key: "so2", label: t("batch.so2"), hint: t("batch.so2Hint"), type: "number" },
    { key: "ash", label: t("batch.ash"), hint: t("batch.ashHint"), type: "number" },
    { key: "agingMonths", label: t("batch.agingMonths"), hint: t("batch.agingHint"), type: "number" },
    { key: "barrelId", label: t("batch.barrelId") },
    { key: "temperature", label: t("batch.temperature"), type: "number" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">{t("batch.title")}</h1>
        {existingBatch?.modifiedAt && (
          <Badge variant="secondary">{t("batch.modified")}</Badge>
        )}
      </div>

      {warnings.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
            <div className="space-y-1">
              {warnings.map((w, i) => (
                <p key={i} className="text-sm text-destructive font-medium">{w}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>{f.label}</Label>
                <Input
                  type={f.type || "text"}
                  step={f.type === "number" ? "any" : undefined}
                  value={(form as any)[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                  readOnly={f.key === "batchId"}
                  className={f.key === "batchId" ? "bg-muted" : ""}
                />
                {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Label>{t("batch.notes")}</Label>
            <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Button size="lg" onClick={handleSave} className="gap-2">
        <Save className="h-4 w-4" />
        {existingBatch ? t("batch.update") : t("batch.save")}
      </Button>
    </div>
  );
}
