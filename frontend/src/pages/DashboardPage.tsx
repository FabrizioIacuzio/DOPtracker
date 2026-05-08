import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";
import { format, parseISO, startOfMonth } from "date-fns";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { batches } = useAppData();

  const getPrimaryVolume = (b: typeof batches[0]) =>
    Number(b.fields['volume'] ?? b.fields['total_liters'] ?? b.fields['total_weight_kg'] ?? b.fields['milk_liters'] ?? b.fields['cow_milk_liters'] ?? 0)

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = format(now, "yyyy-MM");
    const monthBatches = batches.filter((b) => b.date.startsWith(thisMonth));
    const totalVolume = monthBatches.reduce((s, b) => s + getPrimaryVolume(b), 0);
    const conformant = monthBatches.filter((b) => !b.hasWarnings).length;
    const rate = monthBatches.length > 0 ? Math.round((conformant / monthBatches.length) * 100) : 100;
    const nonConf = monthBatches.filter((b) => b.hasWarnings).length;
    return { monthCount: monthBatches.length, totalVolume, rate, nonConf };
  }, [batches]);

  const volumeData = useMemo(() => {
    const months: Record<string, number> = {};
    batches.forEach((b) => {
      const m = format(parseISO(b.date), "yyyy-MM");
      months[m] = (months[m] || 0) + getPrimaryVolume(b);
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, volume]) => ({ month: format(parseISO(month + "-01"), "MMM yy"), volume: Math.round(volume) }));
  }, [batches]);

  const acidityData = useMemo(() => {
    return batches
      .slice(-20)
      .map((b) => ({ batch: b.batchId.slice(-4), acidity: Number(b.fields['acidity'] ?? 0), min: 6 }));
  }, [batches]);

  const kpis = [
    { label: t("dashboard.batchesMonth"), value: stats.monthCount, icon: BarChart3, color: "text-primary" },
    { label: t("dashboard.volume"), value: `${stats.totalVolume.toLocaleString()} L`, icon: Activity, color: "text-blue-500" },
    { label: t("dashboard.compliance"), value: `${stats.rate}%`, icon: CheckCircle, color: "text-green-500" },
    { label: t("dashboard.nonConformity"), value: stats.nonConf, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("dashboard.title")}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
