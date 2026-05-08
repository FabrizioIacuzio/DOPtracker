import { env } from '../../config/env'
import { ManualChannelHandler } from './manualChannel'
import { PecChannelHandler } from './pecChannel'
import { EmailChannelHandler } from './emailChannel'
import type { ChannelHandler } from './manualChannel'

export type { ChannelHandler, ChannelResult } from './manualChannel'

const manual = new ManualChannelHandler()
const pec    = new PecChannelHandler({ host:env.PEC_SMTP_HOST, port:env.PEC_SMTP_PORT, user:env.PEC_SMTP_USER, pass:env.PEC_SMTP_PASS, from:env.PEC_FROM_ADDRESS })
const email  = new EmailChannelHandler({ host:env.EMAIL_SMTP_HOST, port:env.EMAIL_SMTP_PORT, user:env.EMAIL_SMTP_USER, pass:env.EMAIL_SMTP_PASS, from:env.EMAIL_FROM_ADDRESS })

const registry: Record<string, ChannelHandler> = {
  pec, email, pdf_format: pec,
  web_portal: manual, telematic_sian: manual, fax: manual,
}

export function getChannelHandler(channel: string): ChannelHandler {
  return registry[channel] ?? manual
}
