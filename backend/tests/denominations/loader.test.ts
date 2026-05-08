import path from 'path'
import fs from 'fs'
import os from 'os'
import { loadAllConfigs } from '../../src/denominations/loader'

const valid = {
  id: 'test-dop',
  name: 'Test DOP',
  type: 'DOP' as const,
  control_body: { name: 'CSQA', type: 'csqa' as const, pec: 'test@pec.csqa.it' },
  submission_rules: [],
}

describe('loadAllConfigs', () => {
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'denom-'))
  })
  afterEach(() => {
    fs.rmSync(dir, { recursive: true })
  })

  it('loads a valid config file keyed by id', () => {
    fs.writeFileSync(path.join(dir, 'test-dop.json'), JSON.stringify(valid))
    const map = loadAllConfigs(dir)
    expect(map.get('test-dop')?.name).toBe('Test DOP')
  })

  it('throws with filename when config is invalid', () => {
    fs.writeFileSync(
      path.join(dir, 'bad.json'),
      JSON.stringify({ ...valid, type: 'UNKNOWN' })
    )
    expect(() => loadAllConfigs(dir)).toThrow('bad.json')
  })

  it('ignores non-JSON files', () => {
    fs.writeFileSync(path.join(dir, 'README.md'), '# hi')
    fs.writeFileSync(path.join(dir, 'ok.json'), JSON.stringify(valid))
    expect(() => loadAllConfigs(dir)).not.toThrow()
  })

  it('returns empty map for empty directory', () => {
    expect(loadAllConfigs(dir).size).toBe(0)
  })
})
