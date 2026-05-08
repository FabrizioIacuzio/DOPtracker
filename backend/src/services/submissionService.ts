import { PrismaClient } from '@prisma/client'
import { DenominationService } from './denominationService'
import { DomainError } from '../errors'

type SubmitResult = { type:'queued'; jobId:string } | { type:'manual'; instructions:string }

function nextRunAt(dueDay: number): Date {
  const now = new Date()
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), dueDay, 8, 0, 0)
  return now < thisMonth ? thisMonth : new Date(now.getFullYear(), now.getMonth() + 1, dueDay, 8, 0, 0)
}

export class SubmissionService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly denom: DenominationService,
  ) {}

  async submit(producerId: string, denominationId: string, ruleId: string, payload: unknown): Promise<SubmitResult> {
    const { rule } = this.denom.getRule(denominationId, ruleId)

    if (rule.automation === 'manual') {
      await this.prisma.submission.create({
        data: { producerId, denominationId, ruleId, channel: rule.channel, status: 'manual_pending' },
      })
      return { type: 'manual', instructions: rule.instructions ?? '' }
    }

    const job = await this.prisma.submissionJob.create({
      data: { producerId, denominationId, ruleId, runAt: new Date(), payload: payload as object },
    })
    return { type: 'queued', jobId: job.id }
  }

  async scheduleRecurring(producerId: string, denominationId: string, ruleId: string) {
    const { rule } = this.denom.getRule(denominationId, ruleId)
    if (!rule.schedule) throw new DomainError('RULE_NOT_SCHEDULABLE', `Rule '${ruleId}' has no schedule`)
    const runAt = nextRunAt(rule.schedule.due_day)
    return this.prisma.submissionSchedule.upsert({
      where: { producerId_denominationId_ruleId: { producerId, denominationId, ruleId } },
      create: { producerId, denominationId, ruleId, nextRunAt: runAt, active: true },
      update: { active: true, nextRunAt: runAt },
    })
  }
}
