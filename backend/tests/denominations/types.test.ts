import { DenominationConfigSchema } from '../../src/denominations/types'

const base = {
  id: 'asiago', name: 'Asiago DOP', type: 'DOP',
  control_body: { name: 'CSQA', type: 'csqa', pec: 'test@pec.csqa.it' },
  submission_rules: [{
    id: 'r1', doc_type: 'notification', label: 'Test',
    channel: 'web_portal', automation: 'manual', recipient: 'csqa',
    schedule: { frequency: 'monthly', due_day: 15 }, instructions: 'Go here.',
  }],
}

describe('DenominationConfigSchema', () => {
  it('accepts valid config', () => {
    expect(() => DenominationConfigSchema.parse(base)).not.toThrow()
  })
  it('rejects unknown doc_type', () => {
    expect(() => DenominationConfigSchema.parse({
      ...base, submission_rules: [{ ...base.submission_rules[0], doc_type: 'unknown' }]
    })).toThrow()
  })
  it('rejects unknown channel', () => {
    expect(() => DenominationConfigSchema.parse({
      ...base, submission_rules: [{ ...base.submission_rules[0], channel: 'smoke_signal' }]
    })).toThrow()
  })
  it('rejects automation value other than automated|manual', () => {
    expect(() => DenominationConfigSchema.parse({
      ...base, submission_rules: [{ ...base.submission_rules[0], automation: 'maybe' }]
    })).toThrow()
  })
  it('allows null schedule', () => {
    expect(() => DenominationConfigSchema.parse({
      ...base, submission_rules: [{ ...base.submission_rules[0]!, schedule: null }]
    })).not.toThrow()
  })
  it('rejects due_day > 28', () => {
    expect(() => DenominationConfigSchema.parse({
      ...base, submission_rules: [{
        ...base.submission_rules[0]!, schedule: { frequency: 'monthly', due_day: 31 }
      }]
    })).toThrow()
  })
})
