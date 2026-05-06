import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Pencil, Activity, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isToday, isSameMonth, parseISO } from "date-fns";
import { it as itLocale, enUS } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HomePage() {
  const { t, lang } = useLanguage();
  const { batches } = useAppData();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const locale = lang === "it" ? itLocale : enUS;

  // Calendar logic
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

  // Recent batches (last 10)
  const recentBatches = useMemo(() => {
    return [...batches].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  }, [batches]);

  // Dashboard stats
  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = format(now, "yyyy-MM");
    const monthBatches = batches.filter((b) => b.date.startsWith(thisMonth));
    const totalVolume = monthBatches.reduce((s, b) => s + b.volume, 0);
    const conformant = monthBatches.filter((b) => !b.hasWarnings).length;
    const rate = monthBatches.length > 0 ? Math.round((conformant / monthBatches.length) * 100) : 100;
    const nonConf = monthBatches.filter((b) => b.hasWarnings).length;
    return { monthCount: monthBatches.length, totalVolume, rate, nonConf };
  }, [batches]);

  const volumeData = useMemo(() => {
    const months: Record<string, number> = {};
    batches.forEach((b) => {
      const m = format(parseISO(b.date), "yyyy-MM");
      months[m] = (months[m] || 0) + b.volume;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, volume]) => ({ month: format(parseISO(month + "-01"), "MMM yy"), volume: Math.round(volume) }));
  }, [batches]);

  const acidityData = useMemo(() => {
    return batches.slice(-20).map((b) => ({ batch: b.batchId.slice(-4), acidity: b.acidity, min: 6 }));
  }, [batches]);

  const kpis = [
    { label: t("dashboard.batchesMonth"), value: stats.monthCount, icon: BarChart3, color: "text-primary" },
    { label: t("dashboard.volume"), value: `${stats.totalVolume.toLocaleString()} L`, icon: Activity, color: "text-blue-500" },
    { label: t("dashboard.compliance"), value: `${stats.rate}%`, icon: CheckCircle, color: "text-green-500" },
    { label: t("dashboard.nonConformity"), value: stats.nonConf, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-8">
      {/* ── Calendar Section ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">{t("calendar.title")}</h2>
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
              {Array.from({ length: offset }).map((_, i) => <div key={`empty-${i}`} />)}
              {days.map((day) => {
                const dateStr = format(day, "yyyy-MM-dd");
                const info = batchDates[dateStr];
                const today = isToday(day);
                return (
                  <button
                    key={dateStr}
                    onClick={() => handleDayClick(dateStr)}
                    className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all hover:bg-primary/10 ${today ? "ring-2 ring-primary font-bold" : ""} ${!isSameMonth(day, currentMonth) ? "text-muted-foreground/40" : ""}`}
                  >
                    <span>{format(day, "d")}</span>
                    {info && (
                      <div className="flex gap-0.5 mt-0.5 items-center">
                        <span className={`w-2 h-2 rounded-full ${info.hasWarnings ? "bg-destructive" : "bg-green-500"}`} />
                        {info.count > 1 && <span className="text-[10px] text-muted-foreground font-medium">{info.count}</span>}
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
      </section>

      {/* ── Recent Batches Section ── */}
      {recentBatches.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">{t("nav.batch")}</h2>
          <div className="space-y-2">
            {recentBatches.map((batch) => (
              <Card
                key={batch.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => navigate(`/batch/${batch.id}`)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-semibold">{batch.batchId}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.date} · {batch.volume}L · {batch.supplier || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {batch.hasWarnings && (
                      <Badge variant="destructive" className="text-xs">⚠</Badge>
                    )}
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* ── Dashboard Section ── */}
      <section>
        <h2 className="text-2xl font-bold mb-4">{t("dashboard.title")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl bg-muted ${k.color}`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{k.value}</p>
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.volume")} ({t("dashboard.liters")})</CardTitle>
            </CardHeader>
            <CardContent>
              {volumeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={volumeData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="volume" fill="hsl(32, 95%, 44%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  {t("nav.batch")} →
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("dashboard.acidity")}</CardTitle>
            </CardHeader>
            <CardContent>
              {acidityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={acidityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="batch" tick={{ fontSize: 12 }} />
                    <YAxis domain={[4, 10]} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="acidity" stroke="hsl(32, 95%, 44%)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="min" stroke="hsl(0, 84%, 60%)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                  {t("nav.batch")} →
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Calendar day dialog */}
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
