import { loadAllConfigs } from '../denominations/loader'
import { DenominationConfig, SubmissionRule } from '../denominations/types'
import { DomainError } from '../errors'

export class DenominationService {
  private readonly configs: Map<string, DenominationConfig>

  constructor(configsDir?: string) {
    this.configs = loadAllConfigs(configsDir!)
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

export const denominationService = new DenominationService()
