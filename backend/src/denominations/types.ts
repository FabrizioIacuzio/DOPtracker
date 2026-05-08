import { z } from 'zod'

export const ScheduleSchema = z.object({
  frequency: z.enum(['monthly']),
  due_day: z.number().int().min(1).max(28),
})

export const ControlBodySchema = z.object({
  name: z.string(),
  type: z.enum(['csqa', 'check_fruit', 'consortium', 'ministry']),
  pec: z.string().email().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
})

export const SubmissionRuleSchema = z.object({
  id: z.string(),
  doc_type: z.enum([
    'lab_analysis', 'register', 'declaration', 'notification',
    'application_form', 'self_monitoring', 'label', 'document_generic',
  ]),
  label: z.string(),
  channel: z.enum(['pec', 'email', 'web_portal', 'telematic_sian', 'fax', 'pdf_format']),
  automation: z.enum(['automated', 'manual']),
  recipient: z.string(),
  schedule: ScheduleSchema.nullable(),
  instructions: z.string().nullable(),
})

export const DenominationConfigSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['DOP', 'IGP']),
  control_body: ControlBodySchema,
  submission_rules: z.array(SubmissionRuleSchema),
})

export type Schedule = z.infer<typeof ScheduleSchema>
export type ControlBody = z.infer<typeof ControlBodySchema>
export type SubmissionRule = z.infer<typeof SubmissionRuleSchema>
export type DenominationConfig = z.infer<typeof DenominationConfigSchema>
