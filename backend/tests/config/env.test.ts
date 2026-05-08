describe('env loader', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('exports valid env when required vars present', () => {
    process.env['DATABASE_URL'] = 'postgresql://u:p@localhost:5432/test'
    process.env['JWT_SECRET'] = 'a'.repeat(32)
    process.env['JWT_EXPIRES_IN'] = '15m'
    process.env['PORT'] = '3001'
    process.env['CORS_ORIGIN'] = 'http://localhost:5173'
    process.env['LOG_LEVEL'] = 'info'
    jest.resetModules()
    const { env } = require('../../src/config/env')
    expect(env.PORT).toBe(3001)
    expect(env.JWT_SECRET).toBe('a'.repeat(32))
  })

  it('throws when JWT_SECRET shorter than 32 chars', () => {
    process.env['DATABASE_URL'] = 'postgresql://u:p@localhost:5432/test'
    process.env['JWT_SECRET'] = 'short'
    jest.resetModules()
    expect(() => require('../../src/config/env')).toThrow()
  })
})
