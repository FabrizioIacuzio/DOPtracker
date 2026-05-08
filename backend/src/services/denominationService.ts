import path from 'path'
import fs from 'fs'
import { loadAllConfigs } from '../denominations/loader'
import { DenominationConfig, SubmissionRule } from '../denominations/types'
import { DomainError } from '../errors'

const DEFAULT_DIR = path.join(__dirname, '../denominations/configs')

export class DenominationService {
  private readonly configs: Map<string, DenominationConfig>

  constructor(configsDir: string = DEFAULT_DIR) {
    this.configs = loadAllConfigs(configsDir)
  }

  getConfig(id: string): DenominationConfig {
    const config = this.configs.get(id)
    if (config === undefined) throw new DomainError('DENOMINATION_NOT_FOUND', `Denomination '${id}' not found`)
    return config
  }

  getRule(denominationId: string, ruleId: string): { rule: SubmissionRule; config: DenominationConfig } {
    const config = this.getConfig(denominationId)
    const rule = config.submission_rules.find((r) => r.id === ruleId)
    if (rule === undefined) throw new DomainError('RULE_NOT_FOUND', `Rule '${ruleId}' not found in '${denominationId}'`)
    return { rule, config }
  }
}

let denominationServiceInstance: DenominationService | null = null

export function getDenominationService(): DenominationService {
  if (denominationServiceInstance === null) {
    if (!fs.existsSync(DEFAULT_DIR)) {
      fs.mkdirSync(DEFAULT_DIR, { recursive: true })
    }
    denominationServiceInstance = new DenominationService()
  }
  return denominationServiceInstance
}

// Export for backward compatibility and direct use in production
export const denominationService = (() => {
  try {
    if (!fs.existsSync(DEFAULT_DIR)) {
      fs.mkdirSync(DEFAULT_DIR, { recursive: true })
    }
    return new DenominationService()
  } catch {
    // If something goes wrong during initialization, return a lazy proxy
    return getDenominationService() as DenominationService
  }
})()
