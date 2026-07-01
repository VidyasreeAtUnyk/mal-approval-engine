import { logStatusChange } from '@/lib/audit'

const mockInsert = jest.fn()

jest.mock('@/lib/supabase-server', () => ({
  createServiceClient: () => ({
    from: jest.fn().mockReturnValue({ insert: mockInsert }),
  }),
}))

beforeEach(() => {
  mockInsert.mockResolvedValue({ error: null })
})

describe('logStatusChange', () => {
  test('logs draft → pending correctly', async () => {
    await expect(
      logStatusChange('req-1', 'user-1', 'draft', 'pending', null)
    ).resolves.toBeUndefined()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ from_status: 'draft', to_status: 'pending' })
    )
  })

  test('logs pending → approved correctly', async () => {
    await logStatusChange('req-1', 'mgr-1', 'pending', 'approved', null)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ from_status: 'pending', to_status: 'approved' })
    )
  })

  test('logs pending → rejected correctly', async () => {
    await logStatusChange('req-1', 'mgr-1', 'pending', 'rejected', 'Not enough budget')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ to_status: 'rejected' })
    )
  })

  test('includes approver note when provided', async () => {
    await logStatusChange('req-1', 'mgr-1', 'pending', 'rejected', 'Budget exceeded')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'Budget exceeded', to_status: 'rejected' })
    )
  })

  test('handles DB error gracefully without throwing', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'DB connection failed' } })
    await expect(
      logStatusChange('req-1', 'user-1', 'draft', 'pending', null)
    ).resolves.toBeUndefined()
  })
})
