import { buildNotification } from '@/lib/notifications'

const mockInsert = jest.fn().mockResolvedValue({ error: null })

jest.mock('@/lib/supabase-server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({ insert: mockInsert }),
  })),
}))

// Import after mock is set up
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createNotification } = require('@/lib/notifications')

describe('createNotification', () => {
  beforeEach(() => mockInsert.mockClear())

  test('notifies approver when request submitted', async () => {
    await createNotification('approver-1', 'req-1', 'request_pending_review', 'New Budget Request', 'Review needed')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'approver-1',
      request_id: 'req-1',
      type: 'request_pending_review',
    }))
  })

  test('notifies requester when approved', async () => {
    await createNotification('emp-1', 'req-1', 'request_approved', 'Approved', 'Your request was approved.')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ type: 'request_approved' }))
  })

  test('notifies requester when rejected', async () => {
    await createNotification('emp-1', 'req-1', 'request_rejected', 'Rejected', 'Not approved.')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ type: 'request_rejected' }))
  })

  test('includes correct request_id', async () => {
    await createNotification('user-1', 'req-abc-123', 'request_approved', 'Approved', 'msg')
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ request_id: 'req-abc-123' }))
  })

  test('handles DB error without throwing', async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: 'insert failed' } })
    await expect(
      createNotification('u', 'r', 'request_approved', 't', 'm')
    ).resolves.toBeUndefined()
  })
})

describe('buildNotification', () => {
  test('pending_review includes requester name', () => {
    const n = buildNotification('request_pending_review', 'Alice', 'Budget Request')
    expect(n.title).toBe('New Budget Request')
    expect(n.message).toContain('Alice')
  })

  test('approved without note uses default message', () => {
    const n = buildNotification('request_approved', 'Alice', 'Budget Request')
    expect(n.title).toBe('Budget Request Approved')
    expect(n.message).not.toContain('Note:')
  })

  test('approved with note includes note', () => {
    const n = buildNotification('request_approved', 'Alice', 'Budget Request', 'Great justification')
    expect(n.message).toContain('Great justification')
  })

  test('rejected with note includes reason', () => {
    const n = buildNotification('request_rejected', 'Alice', 'Budget Request', 'Over budget')
    expect(n.message).toContain('Over budget')
  })
})
