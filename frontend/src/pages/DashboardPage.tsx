import { useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppData } from "@/contexts/AppDataContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, BarChart3, CheckCircle, AlertTriangle } from "lucide-react";
import { buildDashboardModel } from "@/lib/dashboardMetrics";

export default function DashboardPage() {
  const { t } = useLanguage();
  const { batches, companyInfo } = useAppData();
  const denominationId = companyInfo?.denominationId ?? "aceto-balsamico-di-modena";

  const dashboard = useMemo(() => buildDashboardModel(batches, denominationId), [batches, denominationId]);

  const kpis = [
    { label: t("dashboard.batchesMonth"), value: dashboard.stats.monthCount, icon: BarChart3, color: "text-primary" },
    { label: dashboard.primaryField?.label ?? t("dashboard.volume"), value: dashboard.stats.totalQuantityLabel, icon: Activity, color: "text-blue-500" },
    { label: t("dashboard.compliance"), value: `${dashboard.stats.rate}%`, icon: CheckCircle, color: "text-green-500" },
    { label: t("dashboard.nonConformity"), value: dashboard.stats.nonConf, icon: AlertTriangle, color: "text-destructive" },
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
            <CardTitle className="text-base">{dashboard.primaryChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.volumeData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dashboard.volumeData}>
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
            <CardTitle className="text-base">{dashboard.metricChartTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            {dashboard.metricData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dashboard.metricData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="batch" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="metric" stroke="hsl(32, 95%, 44%)" strokeWidth={2} dot={{ r: 4 }} />
                  {dashboard.metricData.some((item) => item.min !== undefined) && (
                    <Line type="monotone" dataKey="min" stroke="hsl(0, 84%, 60%)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  )}
                  {dashboard.metricData.some((item) => item.max !== undefined) && (
                    <Line type="monotone" dataKey="max" stroke="hsl(0, 84%, 60%)" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  )}
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
