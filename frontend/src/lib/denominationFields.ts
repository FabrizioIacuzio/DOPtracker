export type FieldType = 'number' | 'text' | 'date' | 'select'
export type FieldValue = string | number | boolean

export interface DenominationField {
  key: string
  label: string
  type: FieldType
  unit?: string
  hint?: string
  options?: string[]
  defaultValue?: FieldValue
  min?: number
  max?: number
  required?: boolean
}

export interface RuleCondition {
  field: string
  equals: FieldValue | FieldValue[]
}

export interface ValidationRule {
  field: string
  label: string
  min?: number
  max?: number
  maxExclusive?: number
  unit?: string
  when?: RuleCondition
}

export interface DenominationConfig {
  fields: DenominationField[]
  rules: ValidationRule[]
}

// Vite resolves this glob at build time. Vitest supports import.meta.glob natively.
const fieldFiles = import.meta.glob('../../../products/*/fields.json', { eager: true })

export function getDenominationConfig(denominationId: string): DenominationConfig {
  const key = `../../../products/${denominationId}/fields.json`
  const mod = fieldFiles[key] as DenominationConfig | undefined
  return mod ?? { fields: [], rules: [] }
}

function valueForField(
  config: DenominationConfig,
  fields: Record<string, FieldValue>,
  field: string,
): FieldValue | undefined {
  const raw = fields[field]
  if (raw !== undefined && raw !== '') return raw
  return config.fields.find((configField) => configField.key === field)?.defaultValue
}

function ruleApplies(
  rule: ValidationRule,
  config: DenominationConfig,
  fields: Record<string, FieldValue>,
): boolean {
  if (rule.when === undefined) return true
  const actual = valueForField(config, fields, rule.when.field)
  const expected = Array.isArray(rule.when.equals) ? rule.when.equals : [rule.when.equals]
  return expected.some((value) => String(value) === String(actual))
}

export function validateDenominationFields(
  denominationId: string,
  fields: Record<string, FieldValue>,
): string[] {
  const config = getDenominationConfig(denominationId)
  const warnings: string[] = []
  for (const rule of config.rules) {
    if (!ruleApplies(rule, config, fields)) continue
    const raw = valueForField(config, fields, rule.field)
    const value = typeof raw === 'string' ? parseFloat(raw) : raw
    if (!value || value <= 0) continue
    if (rule.min !== undefined && value < rule.min) {
      warnings.push(`${rule.label} sotto il minimo (${rule.min}${rule.unit ? ' ' + rule.unit : ''})`)
    }
    if (rule.max !== undefined && value > rule.max) {
      warnings.push(`${rule.label} sopra il massimo (${rule.max}${rule.unit ? ' ' + rule.unit : ''})`)
    }
    if (rule.maxExclusive !== undefined && value >= rule.maxExclusive) {
      warnings.push(`${rule.label} deve essere inferiore a ${rule.maxExclusive}${rule.unit ? ' ' + rule.unit : ''}`)
    }
  }
  return warnings
}
