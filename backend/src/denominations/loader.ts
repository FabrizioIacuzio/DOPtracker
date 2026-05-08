import fs from 'fs'
import path from 'path'
import { DenominationConfigSchema, DenominationConfig } from './types'

const PRODUCTS_DIR = path.resolve(__dirname, '../../../products')

export function loadAllConfigs(dir: string = PRODUCTS_DIR): Map<string, DenominationConfig> {
  const map = new Map<string, DenominationConfig>()
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const submissionFile = path.join(dir, entry.name, 'submission.json')
    if (!fs.existsSync(submissionFile)) continue
    const raw: unknown = JSON.parse(fs.readFileSync(submissionFile, 'utf-8'))
    const result = DenominationConfigSchema.safeParse(raw)
    if (!result.success) {
      throw new Error(`Invalid submission config in ${entry.name}: ${result.error.message}`)
    }
    map.set(result.data.id, result.data)
  }
  return map
}
