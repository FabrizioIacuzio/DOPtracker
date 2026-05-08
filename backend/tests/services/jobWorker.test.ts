import path from 'path'
import fs from 'fs'
import os from 'os'
import { PrismaClient } from '@prisma/client'
import { JobWorker } from '../../src/services/jobWorker'
import { DenominationService } from '../../src/services/denominationService'
import type { ChannelHandler, ChannelResult } from '../../src/services/channels'

const prisma = new PrismaClient()

const cfg = {
  id:'test-dop', name:'Test DOP', type:'DOP',
  control_body:{ name:'CSQA', type:'csqa', pec:'t@pec.csqa.it' },
  submission_rules:[
    { id:'pec-rule', doc_type:'self_monitoring', label:'Auto', channel:'pec', automation:'automated',
      recipient:'csqa', schedule:null, instructions:null },
  ],
}

const mockHandler: ChannelHandler = { send: jest.fn() }

let dir: string, worker: JobWorker, producerId: string

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-'))
  fs.writeFileSync(path.join(dir, 'test-dop.json'), JSON.stringify(cfg))
  const denom = new DenominationService(dir)
  const user = await prisma.user.create({ data:{ email:`wk-${Date.now()}@t.it`, password:'x', name:'W' } })
  producerId = user.id
  worker = new JobWorker(prisma, denom, () => mockHandler, { pollIntervalMs:0, batchSize:10 })
})

afterAll(async () => {
  await prisma.submission.deleteMany({ where:{ producerId } })
  await prisma.submissionJob.deleteMany({ where:{ producerId } })
  await prisma.user.delete({ where:{ id:producerId } })
  fs.rmSync(dir, { recursive:true })
  await prisma.$disconnect()
})

beforeEach(() => jest.clearAllMocks())

describe('JobWorker.tick', () => {
  it('processes a pending job and writes Submission(sent)', async () => {
    ;(mockHandler.send as jest.Mock).mockResolvedValueOnce(
      { success:true, recipient:'t@pec.csqa.it', externalRef:'<m1>' } satisfies ChannelResult
    )
    const job = await prisma.submissionJob.create({
      data:{ producerId, denominationId:'test-dop', ruleId:'pec-rule', runAt:new Date(Date.now()-1000), payload:{} }
    })
    await worker.tick()
    const updated = await prisma.submissionJob.findUniqueOrThrow({ where:{ id:job.id } })
    expect(updated.status).toBe('done')
    const sub = await prisma.submission.findFirst({ where:{ jobId:job.id } })
    expect(sub?.status).toBe('sent')
    expect(sub?.externalRef).toBe('<m1>')
  })

  it('increments attempts and reschedules on failure', async () => {
    ;(mockHandler.send as jest.Mock).mockResolvedValueOnce(
      { success:false, recipient:'t@pec.csqa.it', error:'SMTP timeout' } satisfies ChannelResult
    )
    const job = await prisma.submissionJob.create({
      data:{ producerId, denominationId:'test-dop', ruleId:'pec-rule', runAt:new Date(Date.now()-1000), payload:{} }
    })
    await worker.tick()
    const updated = await prisma.submissionJob.findUniqueOrThrow({ where:{ id:job.id } })
    expect(updated.status).toBe('pending')
    expect(updated.attempts).toBe(1)
    expect(new Date(updated.runAt).getTime()).toBeGreaterThan(Date.now() + 4 * 60_000)
  })

  it('marks dead after maxAttempts failures', async () => {
    ;(mockHandler.send as jest.Mock).mockResolvedValue(
      { success:false, recipient:'t@pec.csqa.it', error:'permanent' } satisfies ChannelResult
    )
    const job = await prisma.submissionJob.create({
      data:{ producerId, denominationId:'test-dop', ruleId:'pec-rule',
             runAt:new Date(Date.now()-1000), attempts:2, maxAttempts:3, payload:{} }
    })
    await worker.tick()
    const updated = await prisma.submissionJob.findUniqueOrThrow({ where:{ id:job.id } })
    expect(updated.status).toBe('dead')
  })

  it('ignores jobs with runAt in the future', async () => {
    const job = await prisma.submissionJob.create({
      data:{ producerId, denominationId:'test-dop', ruleId:'pec-rule', runAt:new Date(Date.now()+60_000), payload:{} }
    })
    await worker.tick()
    const untouched = await prisma.submissionJob.findUniqueOrThrow({ where:{ id:job.id } })
    expect(untouched.status).toBe('pending')
    await prisma.submissionJob.delete({ where:{ id:job.id } })
  })
})
