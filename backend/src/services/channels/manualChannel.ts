import type { SubmissionJob } from '@prisma/client'
import type { SubmissionRule, ControlBody } from '../../denominations/types'

export interface ChannelResult {
  success: boolean
  recipient: string
  externalRef?: string
  error?: string
}

export interface ChannelHandler {
  send(job: SubmissionJob, rule: SubmissionRule, controlBody: ControlBody): Promise<ChannelResult>
}

export class ManualChannelHandler implements ChannelHandler {
  async send(_job: SubmissionJob, _rule: SubmissionRule, _body: ControlBody): Promise<ChannelResult> {
    return { success: true, recipient: 'manual' }
  }
}
