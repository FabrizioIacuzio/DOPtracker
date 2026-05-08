import path from 'path'
import fs from 'fs'
import os from 'os'
import { DenominationService } from '../../src/services/denominationService'
import { DomainError } from '../../src/errors'

const config = {
  id: 'grana-padano', name: 'Grana Padano DOP', type: 'DOP',
  control_body: { name: 'CSQA', type: 'csqa', pec: 'regolamentato@pec.csqa.it' },
  submission_rules: [
    { id: 'monthly', doc_type: 'notification', label: 'Mensile', channel: 'web_portal',
      automation: 'manual', recipient: 'csqa', schedule: { frequency: 'monthly', due_day: 15 },
      instructions: 'Accedere al portale.' },
    { id: 'autocontrollo', doc_type: 'self_monitoring', label: 'Auto', channel: 'pec',
      automation: 'automated', recipient: 'csqa', schedule: null, instructions: null },
  ],
}

describe('DenominationService', () => {
  let dir: string, svc: DenominationService
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dsvc-'))
    fs.writeFileSync(path.join(dir, 'grana-padano.json'), JSON.stringify(config))
    svc = new DenominationService(dir)
  })
  afterEach(() => { fs.rmSync(dir, { recursive: true }) })

  it('getConfig returns config for known id', () => {
    expect(svc.getConfig('grana-padano').name).toBe('Grana Padano DOP')
  })
  it('getConfig throws DENOMINATION_NOT_FOUND for unknown id', () => {
    try { svc.getConfig('nope') } catch (e) {
      expect(e).toBeInstanceOf(DomainError)
      expect((e as DomainError).code).toBe('DENOMINATION_NOT_FOUND')
    }
  })
  it('getRule returns rule and parent config', () => {
    const { rule, config: c } = svc.getRule('grana-padano', 'monthly')
    expect(rule.id).toBe('monthly')
    expect(c.id).toBe('grana-padano')
  })
  it('getRule throws RULE_NOT_FOUND for unknown ruleId', () => {
    try { svc.getRule('grana-padano', 'nope') } catch (e) {
      expect((e as DomainError).code).toBe('RULE_NOT_FOUND')
    }
  })
})
