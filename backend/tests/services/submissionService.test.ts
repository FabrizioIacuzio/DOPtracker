import path from 'path'
import fs from 'fs'
import os from 'os'
import { PrismaClient } from '@prisma/client'
import { SubmissionService } from '../../src/services/submissionService'
import { DenominationService } from '../../src/services/denominationService'
import { DomainError } from '../../src/errors'

const prisma = new PrismaClient()

const cfg = {
  id:'test-dop', name:'Test DOP', type:'DOP',
  control_body:{ name:'CSQA', type:'csqa', pec:'t@pec.csqa.it' },
  submission_rules:[
    { id:'pec-rule', doc_type:'self_monitoring', label:'Auto', channel:'pec', automation:'automated',
      recipient:'csqa', schedule:null, instructions:null },
    { id:'portal-rule', doc_type:'notification', label:'Mensile', channel:'web_portal', automation:'manual',
      recipient:'csqa', schedule:{ frequency:'monthly', due_day:15 }, instructions:'Vai al portale.' },
  ],
}

let dir: string, svc: SubmissionService, producerId: string

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'subsvc-'))
  const denomDir = path.join(dir, 'test-dop')
  fs.mkdirSync(denomDir)
  fs.writeFileSync(path.join(denomDir, 'submission.json'), JSON.stringify(cfg))
  const denom = new DenominationService(dir)
  const user = await prisma.user.create({ data:{ email:`sub-${Date.now()}@t.it`, password:'x', name:'T' } })
  producerId = user.id
  svc = new SubmissionService(prisma, denom)
})

afterAll(async () => {
  await prisma.submission.deleteMany({ where:{ producerId } })
  await prisma.submissionJob.deleteMany({ where:{ producerId } })
  await prisma.submissionSchedule.deleteMany({ where:{ producerId } })
  await prisma.user.delete({ where:{ id:producerId } })
  fs.rmSync(dir, { recursive:true })
  await prisma.$disconnect()
})

describe('submit', () => {
  it('creates SubmissionJob for automated rule', async () => {
    const r = await svc.submit(producerId, 'test-dop', 'pec-rule', {})
    expect(r.type).toBe('queued')
    if (r.type !== 'queued') return
    const job = await prisma.submissionJob.findUniqueOrThrow({ where:{ id:r.jobId } })
    expect(job.status).toBe('pending')
    expect(job.ruleId).toBe('pec-rule')
  })

  it('creates manual Submission for manual rule', async () => {
    const r = await svc.submit(producerId, 'test-dop', 'portal-rule', {})
    expect(r.type).toBe('manual')
    if (r.type !== 'manual') return
    expect(r.instructions).toBe('Vai al portale.')
    const sub = await prisma.submission.findFirst({
      where:{ producerId, ruleId:'portal-rule' }, orderBy:{ createdAt:'desc' }
    })
    expect(sub?.status).toBe('manual_pending')
    expect(sub?.jobId).toBeNull()
  })

  it('throws DomainError for unknown denomination', async () => {
    await expect(svc.submit(producerId, 'ghost', 'any', {})).rejects.toThrow(DomainError)
  })
})

describe('scheduleRecurring', () => {
  it('creates schedule with correct nextRunAt', async () => {
    const s = await svc.scheduleRecurring(producerId, 'test-dop', 'portal-rule')
    expect(s.active).toBe(true)
    expect(new Date(s.nextRunAt).getDate()).toBe(15)
    expect(new Date(s.nextRunAt).getHours()).toBe(8)
    await prisma.submissionSchedule.delete({ where:{ id:s.id } })
  })

  it('throws RULE_NOT_SCHEDULABLE when rule has no schedule', async () => {
    await expect(svc.scheduleRecurring(producerId, 'test-dop', 'pec-rule'))
      .rejects.toThrow(DomainError)
  })

  it('upserts — two calls produce one row', async () => {
    await svc.scheduleRecurring(producerId, 'test-dop', 'portal-rule')
    await svc.scheduleRecurring(producerId, 'test-dop', 'portal-rule')
    const count = await prisma.submissionSchedule.count({ where:{ producerId, ruleId:'portal-rule' } })
    expect(count).toBe(1)
    await prisma.submissionSchedule.deleteMany({ where:{ producerId, ruleId:'portal-rule' } })
  })
})
