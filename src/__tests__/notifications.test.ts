import { createNotification, buildNotification } from '@/lib/notifications'
import { SupabaseClient } from '@supabase/supabase-js'

function makeMock(error: unknown = null) {
  return {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error }),
    }),
  } as unknown as SupabaseClient
}

describe('createNotification', () => {
  test('notifies approver when request submitted', async () => {
    const insertFn = jest.fn().mockResolvedValue({ error: null })
    const supabase = { from: jest.fn().mockReturnValue({ insert: insertFn }) } as unknown as SupabaseClient
    await createNotification('approver-1', 'req-1', 'request_pending_review', 'New Budget Request', 'Review needed', supabase)
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'approver-1',
      request_id: 'req-1',
      type: 'request_pending_review',
    }))
  })

  test('notifies requester when approved', async () => {
    const insertFn = jest.fn().mockResolvedValue({ error: null })
    const supabase = { from: jest.fn().mockReturnValue({ insert: insertFn }) } as unknown as SupabaseClient
    await createNotification('emp-1', 'req-1', 'request_approved', 'Approved', 'Your request was approved.', supabase)
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({ type: 'request_approved' }))
  })

  test('notifies requester when rejected', async () => {
    const insertFn = jest.fn().mockResolvedValue({ error: null })
    const supabase = { from: jest.fn().mockReturnValue({ insert: insertFn }) } as unknown as SupabaseClient
    await createNotification('emp-1', 'req-1', 'request_rejected', 'Rejected', 'Not approved.', supabase)
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({ type: 'request_rejected' }))
  })

  test('includes correct request_id', async () => {
    const insertFn = jest.fn().mockResolvedValue({ error: null })
    const supabase = { from: jest.fn().mockReturnValue({ insert: insertFn }) } as unknown as SupabaseClient
    await createNotification('user-1', 'req-abc-123', 'request_approved', 'Approved', 'msg', supabase)
    expect(insertFn).toHaveBeenCalledWith(expect.objectContaining({ request_id: 'req-abc-123' }))
  })

  test('handles DB error without throwing', async () => {
    const supabase = makeMock({ message: 'insert failed' })
    await expect(
      createNotification('u', 'r', 'request_approved', 't', 'm', supabase)
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
