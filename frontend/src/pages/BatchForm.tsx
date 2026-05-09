import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData, type BatchEntry } from "@/contexts/AppDataContext";
import { getDenominationConfig, validateDenominationFields } from "@/lib/denominationFields";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Save, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

function generateBatchId(denominationId: string) {
  const prefix = denominationId.split('-').map((p) => p[0]?.toUpperCase() ?? '').join('').slice(0, 4)
  return `${prefix}-${format(new Date(), "yyyyMMdd")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
}

export default function BatchForm() {
  const { t } = useLanguage();
  const { addBatch, updateBatch, batches, companyInfo } = useAppData();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();

  const denominationId = companyInfo?.denominationId ?? 'aceto-balsamico-di-modena'
  const config = getDenominationConfig(denominationId)

  const existingBatch = id ? batches.find((b) => b.id === id) : null;
  const prefillDate = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");

  const [date, setDate] = useState(existingBatch?.date ?? prefillDate)
  const [batchId] = useState(existingBatch?.batchId ?? generateBatchId(denominationId))
  const [notes, setNotes] = useState(existingBatch?.notes ?? '')
  const [fields, setFields] = useState<Record<string, string>>(() => {
    if (existingBatch) {
      return Object.fromEntries(
        Object.entries(existingBatch.fields).map(([k, v]) => [k, String(v)])
      )
    }
    return Object.fromEntries(
      config.fields.map((f) => [f.key, f.defaultValue === undefined ? '' : String(f.defaultValue)])
    )
  })

  const [warnings, setWarnings] = useState<string[]>([])

  useEffect(() => {
    setWarnings(validateDenominationFields(denominationId, fields))
  }, [denominationId, fields])

  const setField = (key: string, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  const handleSave = () => {
    const entry: BatchEntry = {
      id: existingBatch?.id ?? crypto.randomUUID(),
      date,
      batchId,
      denominationId,
      fields,
      notes,
      createdAt: existingBatch?.createdAt ?? new Date().toISOString(),
      modifiedAt: existingBatch ? new Date().toISOString() : undefined,
      hasWarnings: warnings.length > 0,
    }
    if (existingBatch) {
      updateBatch(existingBatch.id, entry)
    } else {
      addBatch(entry)
    }
    toast.success(t("batch.saved"))
    navigate("/home")
  }

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
            {/* Fixed header fields */}
            <div className="space-y-1.5">
              <Label>{t("batch.date")}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("batch.batchId")}</Label>
              <Input value={batchId} readOnly className="bg-muted" />
            </div>

            {/* Denomination-specific fields */}
            {config.fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label>
                  {f.label}
                  {f.unit && <span className="ml-1 text-xs text-muted-foreground">({f.unit})</span>}
                </Label>
                {f.type === 'select' && f.options ? (
                  <Select
                    value={fields[f.key] ?? ''}
                    onValueChange={(v) => setField(f.key, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona..." />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    step={f.type === 'number' ? 'any' : undefined}
                    value={fields[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                  />
                )}
                {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label>{t("batch.notes")}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
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
