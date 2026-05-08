import { api } from './client'

export interface Submission {
  id: string; jobId: string | null; producerId: string
  denominationId: string; ruleId: string; channel: string
  status: 'sent' | 'failed' | 'manual_pending'
  recipient: string | null; sentAt: string | null
  externalRef: string | null; errorMessage: string | null; createdAt: string
}

export interface SubmissionSchedule {
  id: string; producerId: string; denominationId: string; ruleId: string
  active: boolean; nextRunAt: string; createdAt: string
}

export type SubmitResult =
  | { type: 'queued'; jobId: string }
  | { type: 'manual'; instructions: string }

export const submissionsApi = {
  list: (params?: { denominationId?: string; status?: string; page?: number }) => {
    const qs = new URLSearchParams()
    if (params?.denominationId) qs.set('denominationId', params.denominationId)
    if (params?.status) qs.set('status', params.status)
    if (params?.page) qs.set('page', String(params.page))
    const q = qs.toString()
    return api.get<{ submissions: Submission[]; total: number; page: number }>(
      `/submissions${q ? `?${q}` : ''}`
    )
  },
  submit:         (denominationId: string, ruleId: string, payload: unknown = {}) =>
    api.post<SubmitResult>('/submissions', { denominationId, ruleId, payload }),
  listSchedules:  () => api.get<{ schedules: SubmissionSchedule[] }>('/submissions/schedules'),
  createSchedule: (denominationId: string, ruleId: string) =>
    api.post<SubmissionSchedule>('/submissions/schedules', { denominationId, ruleId }),
  deleteSchedule: (id: string) => api.delete<void>(`/submissions/schedules/${id}`),
}
