import nodemailer from 'nodemailer'
import { PecChannelHandler } from '../../../src/services/channels/pecChannel'
import type { SubmissionJob } from '@prisma/client'
import type { SubmissionRule, ControlBody } from '../../../src/denominations/types'

jest.mock('nodemailer')
const mockSend = jest.fn()
;(nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail: mockSend })

const job = {
  id:'j1', scheduleId:null, producerId:'p1', denominationId:'asiago', ruleId:'r1',
  status:'pending' as const, runAt:new Date(), attempts:0, maxAttempts:3,
  payload:{ producerName:'Acetaia', producerEmail:'prod@test.it' },
  errorMessage:null, createdAt:new Date(), updatedAt:new Date(),
} satisfies SubmissionJob

const rule: SubmissionRule = {
  id:'r1', doc_type:'self_monitoring', label:'Autocontrollo', channel:'pec',
  automation:'automated', recipient:'csqa', schedule:null, instructions:null,
}

const body: ControlBody = {
  name:'CSQA', type:'csqa', pec:'regolamentato@pec.csqa.it', email:'regolamentato@csqa.it',
}

describe('PecChannelHandler', () => {
  let h: PecChannelHandler
  beforeEach(() => {
    jest.clearAllMocks()
    h = new PecChannelHandler({ host:'smtp.test', port:465, user:'u', pass:'p', from:'compliance@test.it' })
  })

  it('sends to the control body PEC address', async () => {
    mockSend.mockResolvedValueOnce({ messageId:'<m1>' })
    const r = await h.send(job, rule, body)
    expect(r.success).toBe(true)
    expect(r.recipient).toBe('regolamentato@pec.csqa.it')
    expect(mockSend.mock.calls[0][0].to).toBe('regolamentato@pec.csqa.it')
  })

  it('includes denomination id in subject', async () => {
    mockSend.mockResolvedValueOnce({ messageId:'<m2>' })
    await h.send(job, rule, body)
    expect(mockSend.mock.calls[0][0].subject).toContain('asiago')
  })

  it('BCCs the producer email from payload', async () => {
    mockSend.mockResolvedValueOnce({ messageId:'<m3>' })
    await h.send(job, rule, body)
    expect(mockSend.mock.calls[0][0].bcc).toBe('prod@test.it')
  })

  it('returns externalRef equal to SMTP messageId', async () => {
    mockSend.mockResolvedValueOnce({ messageId:'<unique@pec>' })
    const r = await h.send(job, rule, body)
    expect(r.externalRef).toBe('<unique@pec>')
  })

  it('returns success:false when sendMail throws', async () => {
    mockSend.mockRejectedValueOnce(new Error('SMTP refused'))
    const r = await h.send(job, rule, body)
    expect(r.success).toBe(false)
    expect(r.error).toBe('SMTP refused')
  })
})
