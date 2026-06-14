/**
 * Tests for request-permissions.ts
 *
 * GAP THESE TESTS CLOSE:
 * - "Admin can't approve" bug: requiresApproverFilter was effectively always true
 *   (the .eq('approver_id') was applied unconditionally). Now the rule is explicit
 *   and tested — admin bypasses it, everyone else is scoped.
 * - "Withdraw 500" bug: canWithdraw rule was inline; no test existed to assert
 *   that only pending/draft can be withdrawn. Now it's explicit and tested.
 */
import { requiresApproverFilter, canWithdraw, canReview } from '@/lib/request-permissions'

describe('requiresApproverFilter', () => {
  test('admin does NOT require approver filter — can approve any request', () => {
    expect(requiresApproverFilter('admin')).toBe(false)
  })

  test('manager DOES require approver filter — only their own requests', () => {
    expect(requiresApproverFilter('manager')).toBe(true)
  })

  test('employee DOES require approver filter', () => {
    expect(requiresApproverFilter('employee')).toBe(true)
  })
})

describe('canWithdraw', () => {
  test('pending request can be withdrawn', () => {
    expect(canWithdraw('pending')).toBe(true)
  })

  test('draft request can be withdrawn', () => {
    expect(canWithdraw('draft')).toBe(true)
  })

  test('approved request cannot be withdrawn', () => {
    expect(canWithdraw('approved')).toBe(false)
  })

  test('rejected request cannot be withdrawn', () => {
    expect(canWithdraw('rejected')).toBe(false)
  })
})

describe('canReview', () => {
  test('manager can review', () => {
    expect(canReview('manager')).toBe(true)
  })

  test('admin can review', () => {
    expect(canReview('admin')).toBe(true)
  })

  test('employee cannot review', () => {
    expect(canReview('employee')).toBe(false)
  })
})
