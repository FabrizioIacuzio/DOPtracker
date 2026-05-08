import fs from 'fs'
import path from 'path'
import { DenominationConfigSchema, DenominationConfig } from './types'

const DEFAULT_DIR = path.join(__dirname, 'configs')

export function loadAllConfigs(dir: string = DEFAULT_DIR): Map<string, DenominationConfig> {
  const map = new Map<string, DenominationConfig>()
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const raw: unknown = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'))
    const result = DenominationConfigSchema.safeParse(raw)
    if (!result.success) {
      throw new Error(`Invalid denomination config in ${file}: ${result.error.message}`)
    }
    map.set(result.data.id, result.data)
  }
  return map
}
