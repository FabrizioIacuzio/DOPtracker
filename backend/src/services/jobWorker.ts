import { PrismaClient } from '@prisma/client'
import { DenominationService } from './denominationService'
import type { ChannelHandler } from './channels'

const BACKOFF_MS = [5 * 60_000, 30 * 60_000, 120 * 60_000] as const

interface WorkerConfig { pollIntervalMs: number; batchSize: number }

export class JobWorker {
  private timer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly prisma: PrismaClient,
    private readonly denom: DenominationService,
    private readonly getHandler: (channel: string) => ChannelHandler,
    private readonly config: WorkerConfig,
  ) {}

  start(): void {
    const schedule = () => {
      this.timer = setTimeout(async () => { await this.tick(); schedule() }, this.config.pollIntervalMs)
    }
    schedule()
  }

  stop(): void { if (this.timer) clearTimeout(this.timer) }

  async tick(): Promise<void> {
    const now = new Date()
    const jobs = await this.prisma.$transaction(async (tx) => {
      const candidates = await tx.submissionJob.findMany({
        where: { status:'pending', runAt:{ lte:now } },
        take: this.config.batchSize, orderBy:{ runAt:'asc' },
      })
      if (!candidates.length) return []
      await tx.submissionJob.updateMany({
        where: { id:{ in:candidates.map(j => j.id) }, status:'pending' },
        data: { status:'processing' },
      })
      return candidates
    })
    await Promise.all(jobs.map(j => this.processJob(j.id)))
  }

  private async processJob(jobId: string): Promise<void> {
    const job = await this.prisma.submissionJob.findUniqueOrThrow({ where:{ id:jobId } })
    const { rule, config } = this.denom.getRule(job.denominationId, job.ruleId)
    const result = await this.getHandler(rule.channel).send(job, rule, config.control_body)

    if (result.success) {
      await this.prisma.submissionJob.update({ where:{ id:jobId }, data:{ status:'done' } })
      await this.prisma.submission.create({
        data: {
          jobId, producerId:job.producerId, denominationId:job.denominationId, ruleId:job.ruleId,
          channel:rule.channel, status:'sent', recipient:result.recipient,
          sentAt:new Date(), externalRef:result.externalRef ?? null,
        },
      })
      if (job.scheduleId) await this.enqueueNext(job.scheduleId)
    } else {
      const attempts = job.attempts + 1
      if (attempts >= job.maxAttempts) {
        await this.prisma.submissionJob.update({
          where:{ id:jobId }, data:{ status:'dead', attempts, errorMessage:result.error ?? null }
        })
      } else {
        const backoff = BACKOFF_MS[attempts - 1] ?? BACKOFF_MS[BACKOFF_MS.length - 1] ?? 120 * 60_000
        await this.prisma.submissionJob.update({
          where:{ id:jobId },
          data:{ status:'pending', attempts, runAt:new Date(Date.now() + backoff), errorMessage:result.error ?? null }
        })
      }
    }
  }

  private async enqueueNext(scheduleId: string): Promise<void> {
    const schedule = await this.prisma.submissionSchedule.findUnique({ where:{ id:scheduleId } })
    if (!schedule?.active) return
    const { rule } = this.denom.getRule(schedule.denominationId, schedule.ruleId)
    if (!rule.schedule) return
    const last = schedule.nextRunAt
    const next = new Date(last.getFullYear(), last.getMonth() + 1, rule.schedule.due_day, 8, 0, 0)
    await this.prisma.submissionSchedule.update({ where:{ id:scheduleId }, data:{ nextRunAt:next } })
    await this.prisma.submissionJob.create({
      data:{ scheduleId, producerId:schedule.producerId, denominationId:schedule.denominationId,
             ruleId:schedule.ruleId, runAt:next, payload:{} }
    })
  }
}
