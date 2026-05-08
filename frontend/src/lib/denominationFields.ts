export type FieldType = 'number' | 'text' | 'date' | 'select'

export interface DenominationField {
  key: string
  label: string
  type: FieldType
  unit?: string
  hint?: string
  options?: string[]
  min?: number
  max?: number
  required?: boolean
}

export interface ValidationRule {
  field: string
  label: string
  min?: number
  max?: number
  unit?: string
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

export function validateDenominationFields(
  denominationId: string,
  fields: Record<string, string | number>,
): string[] {
  const config = getDenominationConfig(denominationId)
  const warnings: string[] = []
  for (const rule of config.rules) {
    const raw = fields[rule.field]
    const value = typeof raw === 'string' ? parseFloat(raw) : raw
    if (!value || value <= 0) continue
    if (rule.min !== undefined && value < rule.min) {
      warnings.push(`${rule.label} sotto il minimo (${rule.min}${rule.unit ? ' ' + rule.unit : ''})`)
    }
    if (rule.max !== undefined && value > rule.max) {
      warnings.push(`${rule.label} sopra il massimo (${rule.max}${rule.unit ? ' ' + rule.unit : ''})`)
    }
  }
  return warnings
}
