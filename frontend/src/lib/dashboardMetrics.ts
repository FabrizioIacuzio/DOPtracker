import { format, parseISO } from "date-fns";
import type { BatchEntry } from "@/contexts/AppDataContext";
import { getDenominationConfig, type DenominationField, type ValidationRule } from "./denominationFields";

const primaryFieldByProduct: Record<string, string> = {
  "aceto-balsamico-di-modena": "volume",
  "bresaola-della-valtellina": "finished_weight_kg",
  gorgonzola: "milk_liters",
  "grana-padano": "milk_liters",
  "mozzarella-di-bufala-campana": "buffalo_milk_kg",
};

function numberFromField(batch: BatchEntry, fieldKey: string): number | null {
  const raw = batch.fields[fieldKey];
  const value = typeof raw === "string" ? Number.parseFloat(raw) : raw;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function fieldByKey(fields: DenominationField[], key: string): DenominationField | undefined {
  return fields.find((field) => field.key === key);
}

function resolvePrimaryField(denominationId: string, fields: DenominationField[]): DenominationField | undefined {
  const preferred = primaryFieldByProduct[denominationId];
  if (preferred) return fieldByKey(fields, preferred);
  return fields.find((field) => field.required && field.type === "number")
    ?? fields.find((field) => field.type === "number");
}

function ruleMatchesBatch(rule: ValidationRule, batch: BatchEntry): boolean {
  if (!rule.when) return true;
  const raw = batch.fields[rule.when.field];
  const expected = Array.isArray(rule.when.equals) ? rule.when.equals : [rule.when.equals];
  return expected.some((value) => String(value) === String(raw));
}

function resolveMetricRule(rules: ValidationRule[], batch: BatchEntry): ValidationRule | undefined {
  return rules.find((rule) => ruleMatchesBatch(rule, batch)) ?? rules[0];
}

function formatQuantity(value: number, unit?: string): string {
  return `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
}

export function productBatches(batches: BatchEntry[], denominationId: string): BatchEntry[] {
  return batches.filter((batch) => batch.denominationId === denominationId);
}

export function buildDashboardModel(
  batches: BatchEntry[],
  denominationId: string,
  now: Date = new Date(),
) {
  const config = getDenominationConfig(denominationId);
  const currentProductBatches = productBatches(batches, denominationId);
  const primaryField = resolvePrimaryField(denominationId, config.fields);
  const metricRule = config.rules[0];
  const metricField = metricRule ? fieldByKey(config.fields, metricRule.field) : undefined;
  const thisMonth = format(now, "yyyy-MM");
  const monthBatches = currentProductBatches.filter((batch) => batch.date.startsWith(thisMonth));
  const totalQuantity = primaryField
    ? monthBatches.reduce((sum, batch) => sum + (numberFromField(batch, primaryField.key) ?? 0), 0)
    : 0;
  const conformant = monthBatches.filter((batch) => !batch.hasWarnings).length;
  const rate = monthBatches.length > 0 ? Math.round((conformant / monthBatches.length) * 100) : 100;
  const nonConf = monthBatches.filter((batch) => batch.hasWarnings).length;

  const volumeData = primaryField
    ? Object.entries(
        currentProductBatches.reduce<Record<string, number>>((months, batch) => {
          const month = format(parseISO(batch.date), "yyyy-MM");
          months[month] = (months[month] ?? 0) + (numberFromField(batch, primaryField.key) ?? 0);
          return months;
        }, {}),
      )
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, volume]) => ({
          month: format(parseISO(`${month}-01`), "MMM yy"),
          volume: Math.round(volume),
        }))
    : [];

  const metricData = metricRule
    ? currentProductBatches
        .slice(-20)
        .map((batch) => {
          const applicableRule = resolveMetricRule(
            config.rules.filter((rule) => rule.field === metricRule.field),
            batch,
          );
          const metric = numberFromField(batch, metricRule.field);
          if (metric === null) return null;
          const dataPoint: { batch: string; metric: number; min?: number; max?: number } = {
            batch: batch.batchId.slice(-4),
            metric,
          };
          const max = applicableRule?.max ?? applicableRule?.maxExclusive;
          if (applicableRule?.min !== undefined) dataPoint.min = applicableRule.min;
          if (max !== undefined) dataPoint.max = max;
          return dataPoint;
        })
        .filter((item): item is { batch: string; metric: number; min?: number; max?: number } => item !== null)
    : [];

  return {
    batches: currentProductBatches,
    primaryField,
    metricField,
    metricRule,
    stats: {
      monthCount: monthBatches.length,
      totalQuantity,
      totalQuantityLabel: formatQuantity(totalQuantity, primaryField?.unit),
      rate,
      nonConf,
    },
    volumeData,
    metricData,
    primaryChartTitle: primaryField ? `${primaryField.label}${primaryField.unit ? ` (${primaryField.unit})` : ""}` : "Produzione",
    metricChartTitle: metricField ? `Trend ${metricRule?.label ?? metricField.label}` : "Trend parametro",
  };
}
