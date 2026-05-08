import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../test/render'
import CalendarPage from './CalendarPage'
import * as mod from '../api/submissions'

vi.mock('../api/submissions', () => ({
  submissionsApi: { listSchedules: vi.fn() },
}))

const mockList = vi.mocked(mod.submissionsApi.listSchedules)

describe('CalendarPage schedules section', () => {
  beforeEach(() => {
    mockList.mockResolvedValue({
      schedules: [{
        id:'sc1', producerId:'p1', denominationId:'asiago',
        ruleId:'monthly-production-report', active:true,
        nextRunAt: new Date(Date.now() + 5 * 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      }],
    })
  })

  it('shows the Scadenze Ricorrenti heading', async () => {
    render(<CalendarPage />)
    await waitFor(() => expect(mockList).toHaveBeenCalledOnce())
    expect(screen.getByText('Scadenze Ricorrenti')).toBeInTheDocument()
  })

  it('shows the denomination name', async () => {
    render(<CalendarPage />)
    await waitFor(() => screen.getByText('asiago'))
    expect(screen.getByText('asiago')).toBeInTheDocument()
  })
})
