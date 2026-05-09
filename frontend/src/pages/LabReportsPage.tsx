import { useState, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData, type LabReport } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, FlaskConical } from "lucide-react";
import { format } from "date-fns";
import { getLabAnalysisRequirement } from "@/lib/labAnalysisRequirements";

const MOCK_EXTRACTED = {
  acidity: 6.8,
  density: 1.24,
  sugars: 145,
  dryExtract: 30.2,
  ash: 0.8,
};

export default function LabReportsPage() {
  const { t } = useLanguage();
  const { labReports, addLabReport, companyInfo } = useAppData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedReport, setSelectedReport] = useState<LabReport | null>(null);
  const denominationId = companyInfo?.denominationId ?? "aceto-balsamico-di-modena";
  const denominationName = companyInfo?.denomination ?? "Aceto Balsamico di Modena IGP";
  const labRequirement = getLabAnalysisRequirement(denominationId);
  const visibleReports = labReports.filter((report) => report.denominationId === undefined || report.denominationId === denominationId);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const report: LabReport = {
      id: crypto.randomUUID(),
      denominationId,
      fileName: file.name,
      labName: "Laboratorio Analisi Modena",
      date: format(new Date(), "yyyy-MM-dd"),
      status: "processed",
      extractedValues: MOCK_EXTRACTED,
    };
    addLabReport(report);
    setSelectedReport(report);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("lab.title")}</h1>

      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{denominationName}</h2>
            <Badge variant="secondary">{labRequirement.statusLabel}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{labRequirement.summary}</p>
          <p className="text-sm font-medium">
            Non trattare il caricamento come obbligatorio finche un revisore umano non conferma piano dei controlli, frequenza e allegati richiesti.
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed border-2">
        <CardContent className="p-8 text-center">
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} />
          <div
            className="cursor-pointer space-y-3"
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) {
                const fakeEvent = { target: { files: [file] } } as any;
                handleUpload(fakeEvent);
              }
            }}
          >
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <p className="text-muted-foreground">{t("lab.dragDrop")}</p>
            <Button variant="outline" size="sm">{t("lab.upload")}</Button>
          </div>
        </CardContent>
      </Card>

      {visibleReports.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("lab.date")}</TableHead>
                  <TableHead>{t("lab.labName")}</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>{t("lab.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleReports.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedReport(r)}
                  >
                    <TableCell>{r.date}</TableCell>
                    <TableCell>{r.labName}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" /> {r.fileName}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.status === "processed" ? "default" : "secondary"}>
                        {r.status === "processed" ? t("lab.processed") : t("lab.pending")}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedReport?.extractedValues && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              {t("lab.extracted")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Object.entries(selectedReport.extractedValues).map(([key, val]) => (
                <div key={key} className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground capitalize">{key}</p>
                  <p className="text-lg font-semibold">{val}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
