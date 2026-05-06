import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Download, CheckCircle2, ExternalLink } from "lucide-react";
import { format, subMonths } from "date-fns";

interface MockDoc {
  id: string;
  period: string;
  status: "draft" | "ready" | "submitted";
  batchCount: number;
  totalVolume: number;
}

export default function DocumentsPage() {
  const { t } = useLanguage();
  const { batches } = useAppData();
  const [previewDoc, setPreviewDoc] = useState<MockDoc | null>(null);
  const [showChecklist, setShowChecklist] = useState(false);

  const documents = useMemo<MockDoc[]>(() => {
    const now = new Date();
    return [0, 1, 2].map((i) => {
      const month = subMonths(now, i);
      const period = format(month, "yyyy-MM");
      const monthBatches = batches.filter((b) => b.date.startsWith(period));
      return {
        id: period,
        period: format(month, "MMMM yyyy"),
        status: i === 0 ? "draft" as const : i === 1 ? "ready" as const : "submitted" as const,
        batchCount: monthBatches.length,
        totalVolume: monthBatches.reduce((s, b) => s + b.volume, 0),
      };
    });
  }, [batches]);

  const statusBadge = (status: string) => {
    const variant = status === "submitted" ? "default" : status === "ready" ? "secondary" : "outline";
    const label = status === "submitted" ? t("docs.submitted") : status === "ready" ? t("docs.ready") : t("docs.draft");
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("docs.title")}</h1>
        <Button variant="outline" onClick={() => setShowChecklist(true)} className="gap-2">
          <CheckCircle2 className="h-4 w-4" /> {t("docs.checklist")}
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("docs.period")}</TableHead>
                <TableHead>Lotti</TableHead>
                <TableHead>Volume</TableHead>
                <TableHead>{t("docs.status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium capitalize">{doc.period}</TableCell>
                  <TableCell>{doc.batchCount}</TableCell>
                  <TableCell>{doc.totalVolume.toLocaleString()} L</TableCell>
                  <TableCell>{statusBadge(doc.status)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setPreviewDoc(doc)} className="gap-1.5">
                      <FileText className="h-4 w-4" /> {t("docs.view")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Dichiarazione Periodica — {previewDoc?.period}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            <div className="border rounded-lg p-6 bg-white text-black space-y-6 text-sm">
              <div className="text-center border-b pb-4">
                <p className="text-xs text-gray-500">CSQA Certificazioni S.r.l.</p>
                <h2 className="text-lg font-bold mt-1">DICHIARAZIONE PERIODICA DI PRODUZIONE</h2>
                <p className="text-gray-600">Aceto Balsamico di Modena IGP</p>
                <p className="text-gray-500 text-xs mt-1">Periodo: {previewDoc.period}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="font-semibold">Operatore:</p>
                  <p>Acetaia Esempio S.r.l.</p>
                  <p>Via Roma 42, Modena (MO)</p>
                </div>
                <div>
                  <p className="font-semibold">Codice ICQRF:</p>
                  <p>IT-041-BIO-123</p>
                  <p className="font-semibold mt-2">Organismo di Controllo:</p>
                  <p>CSQA Certificazioni S.r.l.</p>
                </div>
              </div>

              <div>
                <p className="font-semibold mb-2">Riepilogo Produzione</p>
                <table className="w-full border text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left">Parametro</th>
                      <th className="border p-2 text-right">Valore</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr><td className="border p-2">Lotti registrati</td><td className="border p-2 text-right">{previewDoc.batchCount}</td></tr>
                    <tr><td className="border p-2">Volume totale (litri)</td><td className="border p-2 text-right">{previewDoc.totalVolume.toLocaleString()}</td></tr>
                    <tr><td className="border p-2">Non conformità</td><td className="border p-2 text-right">0</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="text-center text-xs text-gray-400 pt-4 border-t">
                Documento generato automaticamente — DOPComply
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Checklist Dialog */}
      <Dialog open={showChecklist} onOpenChange={setShowChecklist}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("docs.checklist")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{t("docs.checklistDesc")}</p>
          <div className="space-y-4">
            {[t("docs.step1"), t("docs.step2"), t("docs.step3"), t("docs.step4")].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm pt-1">{step}</p>
              </div>
            ))}
            <div className="pt-2">
              <Button variant="outline" className="gap-2 w-full">
                <ExternalLink className="h-4 w-4" /> Vai al portale CSQA
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
