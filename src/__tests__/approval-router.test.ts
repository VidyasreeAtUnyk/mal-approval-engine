import { getApprover } from '@/lib/approval-router'
import { SupabaseClient } from '@supabase/supabase-js'

function makeChainedMock(profileData: unknown, adminData?: unknown) {
  return {
    from: jest.fn().mockImplementation(() => ({
      select: jest.fn().mockImplementation(() => ({
        eq: jest.fn().mockImplementation(() => ({
          single: jest.fn().mockResolvedValue({ data: profileData, error: profileData ? null : { message: 'not found' } }),
          eq: jest.fn().mockImplementation(() => ({
            eq: jest.fn().mockImplementation(() => ({
              limit: jest.fn().mockImplementation(() => ({
                single: jest.fn().mockResolvedValue({ data: adminData ?? null, error: adminData ? null : { message: 'not found' } }),
              })),
            })),
          })),
        })),
      })),
    })),
  } as unknown as SupabaseClient
}

describe('getApprover', () => {
  test('employee routes to their manager_id', async () => {
    const supabase = makeChainedMock({ role: 'employee', manager_id: 'mgr-123', is_active: true })
    const result = await getApprover('emp-1', supabase)
    expect(result.approverId).toBe('mgr-123')
    expect(result.reason).toBe('manager')
  })

  test('admin returns self', async () => {
    const supabase = makeChainedMock({ role: 'admin', manager_id: null, is_active: true })
    const result = await getApprover('admin-1', supabase)
    expect(result.approverId).toBe('admin-1')
    expect(result.reason).toBe('self')
  })

  test('returns not_found if profile missing', async () => {
    const supabase = makeChainedMock(null)
    const result = await getApprover('ghost', supabase)
    expect(result.approverId).toBeNull()
    expect(result.reason).toBe('not_found')
  })

  test('employee with no manager returns no_manager', async () => {
    const supabase = makeChainedMock({ role: 'employee', manager_id: null, is_active: true })
    const result = await getApprover('emp-2', supabase)
    expect(result.approverId).toBeNull()
    expect(result.reason).toBe('no_manager')
  })
})
