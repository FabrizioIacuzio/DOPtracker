import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData, type BatchEntry } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameMonth } from "date-fns";
import { it, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function CalendarPage() {
  const { t, lang } = useLanguage();
  const { batches } = useAppData();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const locale = lang === "it" ? it : enUS;
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const batchDates = useMemo(() => {
    const map: Record<string, { count: number; hasWarnings: boolean }> = {};
    batches.forEach((b) => {
      if (!map[b.date]) map[b.date] = { count: 0, hasWarnings: false };
      map[b.date].count++;
      if (b.hasWarnings) map[b.date].hasWarnings = true;
    });
    return map;
  }, [batches]);

  const selectedDayBatches = useMemo(() => {
    if (!selectedDate) return [];
    return batches.filter((b) => b.date === selectedDate);
  }, [selectedDate, batches]);

  const startDayOfWeek = getDay(startOfMonth(currentMonth));
  const offset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const weekDays = lang === "it"
    ? ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handleDayClick = (dateStr: string) => {
    const dayBatches = batches.filter((b) => b.date === dateStr);
    if (dayBatches.length === 0) {
      navigate(`/batch/new?date=${dateStr}`);
    } else {
      setSelectedDate(dateStr);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("calendar.title")}</h1>
        <Button onClick={() => navigate("/batch/new")} className="gap-2">
          <Plus className="h-4 w-4" /> {t("batch.newBatch")}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="text-lg capitalize">
              {format(currentMonth, "MMMM yyyy", { locale })}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const info = batchDates[dateStr];
              const today = isToday(day);
              return (
                <button
                  key={dateStr}
                  onClick={() => handleDayClick(dateStr)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:bg-primary/10 ${
                    today ? "ring-2 ring-primary font-bold" : ""
                  } ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/40" : ""}`}
                >
                  <span>{format(day, "d")}</span>
                  {info && (
                    <div className="flex gap-0.5 mt-0.5 items-center">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          info.hasWarnings ? "bg-destructive" : "bg-green-500"
                        }`}
                      />
                      {info.count > 1 && (
                        <span className="text-[10px] text-muted-foreground font-medium">{info.count}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {t("calendar.logged")}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-destructive" /> {t("calendar.flagged")}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedDate} onOpenChange={(open) => !open && setSelectedDate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("calendar.dayOptions")} — {selectedDate}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedDayBatches.map((batch) => (
              <Button
                key={batch.id}
                variant="outline"
                className="w-full justify-start gap-3 h-auto py-3"
                onClick={() => { setSelectedDate(null); navigate(`/batch/${batch.id}`); }}
              >
                <Pencil className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="font-medium">{batch.batchId}</div>
                  <div className="text-xs text-muted-foreground">
                    {batch.volume}L · {batch.supplier || "—"}
                    {batch.hasWarnings && <Badge variant="destructive" className="ml-2 text-[10px] px-1 py-0">⚠</Badge>}
                  </div>
                </div>
              </Button>
            ))}
            <Button
              className="w-full gap-2"
              onClick={() => { setSelectedDate(null); navigate(`/batch/new?date=${selectedDate}`); }}
            >
              <Plus className="h-4 w-4" /> {t("calendar.newBatch")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
