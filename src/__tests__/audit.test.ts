import { logStatusChange } from '@/lib/audit'
import { SupabaseClient } from '@supabase/supabase-js'

function makeMock(error: unknown = null) {
  return {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error }),
    }),
  } as unknown as SupabaseClient
}

describe('logStatusChange', () => {
  test('logs draft → pending correctly', async () => {
    const supabase = makeMock()
    await expect(
      logStatusChange('req-1', 'user-1', 'draft', 'pending', null, supabase)
    ).resolves.toBeUndefined()
    expect(supabase.from).toHaveBeenCalledWith('request_audit_log')
  })

  test('logs pending → approved correctly', async () => {
    const supabase = makeMock()
    await logStatusChange('req-1', 'mgr-1', 'pending', 'approved', null, supabase)
    expect(supabase.from).toHaveBeenCalledWith('request_audit_log')
  })

  test('logs pending → rejected correctly', async () => {
    const supabase = makeMock()
    await logStatusChange('req-1', 'mgr-1', 'pending', 'rejected', 'Not enough budget', supabase)
    expect(supabase.from).toHaveBeenCalledWith('request_audit_log')
  })

  test('includes approver note when provided', async () => {
    const insertFn = jest.fn().mockResolvedValue({ error: null })
    const supabase = {
      from: jest.fn().mockReturnValue({ insert: insertFn }),
    } as unknown as SupabaseClient

    await logStatusChange('req-1', 'mgr-1', 'pending', 'rejected', 'Budget exceeded', supabase)
    expect(insertFn).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'Budget exceeded', to_status: 'rejected' })
    )
  })

  test('handles DB error gracefully without throwing', async () => {
    const supabase = makeMock({ message: 'DB connection failed' })
    await expect(
      logStatusChange('req-1', 'user-1', 'draft', 'pending', null, supabase)
    ).resolves.toBeUndefined()
  })
})
