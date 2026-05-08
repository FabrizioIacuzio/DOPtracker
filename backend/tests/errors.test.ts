import { DomainError } from '../src/errors'

describe('DomainError', () => {
  it('carries a code and message', () => {
    const err = new DomainError('DENOMINATION_NOT_FOUND', 'not found')
    expect(err.code).toBe('DENOMINATION_NOT_FOUND')
    expect(err.message).toBe('not found')
    expect(err).toBeInstanceOf(Error)
  })

  it('serialises to { error: { code, message } }', () => {
    const err = new DomainError('RULE_NOT_FOUND', 'missing')
    expect(err.toResponse()).toEqual({ error: { code: 'RULE_NOT_FOUND', message: 'missing' } })
  })
})
