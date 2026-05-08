import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText, Send } from "lucide-react";
import { format } from "date-fns";
import { submissionsApi, type Submission } from "@/api/submissions";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<Submission["status"], string> = {
  sent: "Inviato", failed: "Errore", manual_pending: "In attesa",
};
const STATUS_VARIANT: Record<Submission["status"], "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default", failed: "destructive", manual_pending: "outline",
};

export default function DocumentsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Submission | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: () => submissionsApi.list(),
  });

  const submit = useMutation({
    mutationFn: ({ denominationId, ruleId }: { denominationId: string; ruleId: string }) =>
      submissionsApi.submit(denominationId, ruleId, {}),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["submissions"] });
      toast({ title: r.type === "manual" ? "Istruzioni invio" : "Invio in corso",
               description: r.type === "manual" ? r.instructions : "Documento inviato automaticamente." });
    },
    onError: () => toast({ title: "Errore", description: "Impossibile avviare l'invio.", variant: "destructive" }),
  });

  const rows = data?.submissions ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("docs.title")}</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Denominazione</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Canale</TableHead>
                <TableHead>{t("docs.status")}</TableHead>
                <TableHead>Data</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Caricamento…</TableCell></TableRow>
              )}
              {!isLoading && !rows.length && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nessun documento.</TableCell></TableRow>
              )}
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.denominationId}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.ruleId}</TableCell>
                  <TableCell className="text-sm">{s.channel}</TableCell>
                  <TableCell><Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(s.createdAt), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setSelected(s)} className="gap-1.5">
                      <FileText className="h-4 w-4" /> Dettagli
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Dettagli Invio</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Denominazione</span><span>{selected.denominationId}</span>
                <span className="text-muted-foreground">Regola</span><span>{selected.ruleId}</span>
                <span className="text-muted-foreground">Canale</span><span>{selected.channel}</span>
                <span className="text-muted-foreground">Stato</span>
                <Badge variant={STATUS_VARIANT[selected.status]}>{STATUS_LABEL[selected.status]}</Badge>
                {selected.recipient && <><span className="text-muted-foreground">Destinatario</span><span>{selected.recipient}</span></>}
                {selected.sentAt && <><span className="text-muted-foreground">Inviato il</span><span>{format(new Date(selected.sentAt), "dd/MM/yyyy HH:mm")}</span></>}
              </div>
              {selected.status === "manual_pending" && (
                <Button className="w-full gap-2" disabled={submit.isPending}
                  onClick={() => submit.mutate({ denominationId: selected.denominationId, ruleId: selected.ruleId })}>
                  <Send className="h-4 w-4" />{submit.isPending ? "Invio…" : "Avvia invio"}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
