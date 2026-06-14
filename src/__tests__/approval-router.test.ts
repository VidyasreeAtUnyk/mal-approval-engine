import { SupabaseClient } from '@supabase/supabase-js'

// Mock service client for manager→admin lookup
const mockSvcSingle = jest.fn()
jest.mock('@/lib/supabase-server', () => ({
  createServiceClient: jest.fn(() => ({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue({ single: mockSvcSingle }),
    }),
  })),
}))

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { getApprover } = require('@/lib/approval-router')

function makeSessionMock(profileData: unknown) {
  return {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: profileData,
          error: profileData ? null : { message: 'not found' },
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

describe('getApprover', () => {
  beforeEach(() => mockSvcSingle.mockReset())

  test('employee routes to their manager_id', async () => {
    const supabase = makeSessionMock({ role: 'employee', manager_id: 'mgr-123', is_active: true })
    const result = await getApprover('emp-1', supabase)
    expect(result.approverId).toBe('mgr-123')
    expect(result.reason).toBe('manager')
  })

  test('admin returns self', async () => {
    const supabase = makeSessionMock({ role: 'admin', manager_id: null, is_active: true })
    const result = await getApprover('admin-1', supabase)
    expect(result.approverId).toBe('admin-1')
    expect(result.reason).toBe('self')
  })

  test('returns not_found if profile missing', async () => {
    const supabase = makeSessionMock(null)
    const result = await getApprover('ghost', supabase)
    expect(result.approverId).toBeNull()
    expect(result.reason).toBe('not_found')
  })

  test('employee with no manager returns no_manager', async () => {
    const supabase = makeSessionMock({ role: 'employee', manager_id: null, is_active: true })
    const result = await getApprover('emp-2', supabase)
    expect(result.approverId).toBeNull()
    expect(result.reason).toBe('no_manager')
  })

  test('manager routes to admin via service client', async () => {
    const supabase = makeSessionMock({ role: 'manager', manager_id: null, is_active: true })
    mockSvcSingle.mockResolvedValue({ data: { id: 'admin-99' }, error: null })
    const result = await getApprover('mgr-1', supabase)
    expect(result.approverId).toBe('admin-99')
    expect(result.reason).toBe('admin')
  })

  test('manager with no admin returns no_manager', async () => {
    const supabase = makeSessionMock({ role: 'manager', manager_id: null, is_active: true })
    mockSvcSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const result = await getApprover('mgr-2', supabase)
    expect(result.approverId).toBeNull()
    expect(result.reason).toBe('no_manager')
  })
})
