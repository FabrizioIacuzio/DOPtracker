import nodemailer from 'nodemailer'
import type { SubmissionJob } from '@prisma/client'
import type { SubmissionRule, ControlBody } from '../../denominations/types'
import type { ChannelHandler, ChannelResult } from './manualChannel'

interface SmtpConfig { host: string; port: number; user: string; pass: string; from: string }
interface Payload { producerName?: string; producerEmail?: string }

export class EmailChannelHandler implements ChannelHandler {
  private readonly transporter: nodemailer.Transporter
  private readonly from: string

  constructor(cfg: SmtpConfig) {
    this.from = cfg.from
    this.transporter = nodemailer.createTransport({
      host: cfg.host, port: cfg.port, secure: false,
      auth: { user: cfg.user, pass: cfg.pass },
    })
  }

  async send(job: SubmissionJob, rule: SubmissionRule, body: ControlBody): Promise<ChannelResult> {
    const to = body.email ?? body.pec ?? ''
    const payload = job.payload as Payload
    const date = new Date().toISOString().split('T')[0] ?? ''
    const subject = `[${job.denominationId}] ${rule.label} — ${date}`
    const text = [
      `Gentile Organismo di Controllo,`,
      ``,
      `in allegato la documentazione relativa a: ${rule.label}`,
      `Denominazione: ${job.denominationId}`,
      `Produttore: ${payload.producerName ?? job.producerId}`,
      `Riferimento: ${job.id}`,
    ].join('\n')

    try {
      const info = await this.transporter.sendMail({
        from: this.from, to, subject, text,
        ...(payload.producerEmail ? { bcc: payload.producerEmail } : {}),
      })
      const externalRef = info.messageId as string | undefined
      return { success: true, recipient: to, ...(externalRef !== undefined ? { externalRef } : {}) }
    } catch (err) {
      return { success: false, recipient: to, error: err instanceof Error ? err.message : String(err) }
    }
  }
}
