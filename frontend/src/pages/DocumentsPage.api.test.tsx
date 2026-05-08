import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../test/render'
import DocumentsPage from './DocumentsPage'
import * as mod from '../api/submissions'

vi.mock('../api/submissions', () => ({
  submissionsApi: { list: vi.fn(), submit: vi.fn() },
}))

const mockList = vi.mocked(mod.submissionsApi.list)

describe('DocumentsPage (API)', () => {
  beforeEach(() => {
    mockList.mockResolvedValue({
      submissions: [{
        id:'s1', jobId:null, producerId:'p1', denominationId:'asiago',
        ruleId:'monthly-report', channel:'web_portal', status:'manual_pending',
        recipient:null, sentAt:null, externalRef:null, errorMessage:null,
        createdAt: new Date().toISOString(),
      }],
      total: 1, page: 1,
    })
  })

  it('fetches and renders submissions from the API', async () => {
    render(<DocumentsPage />)
    await waitFor(() => expect(mockList).toHaveBeenCalledOnce())
    expect(screen.getByText('monthly-report')).toBeInTheDocument()
  })

  it('shows "In attesa" badge for manual_pending status', async () => {
    render(<DocumentsPage />)
    await waitFor(() => screen.getByText('In attesa'))
    expect(screen.getByText('In attesa')).toBeInTheDocument()
  })
})
