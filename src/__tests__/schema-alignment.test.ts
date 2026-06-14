/**
 * Schema alignment tests
 *
 * GAP THIS TESTS CLOSES:
 * - The leave request "reason" had min(10) in the schema but the form only enforced
 *   `required` (non-empty). A user entering 5 chars passed the form but got a 422
 *   from the server. No test existed to catch this mismatch.
 *
 * Rule: every flow's Zod schema must accept the MINIMUM value the form would pass —
 * a single non-empty character for text/textarea fields, and a single valid option
 * for selects. If the schema requires MORE than that, it must also be enforced on
 * the client (and that enforcement must be tested separately).
 */
import { BudgetRequestSchema } from '@/flows/budget-request/schema'
import { LeaveRequestSchema } from '@/flows/leave-request/schema'

describe('BudgetRequestSchema — accepts minimum form-valid data', () => {
  const minValid = {
    title: 'x',
    amount: 1,
    category: 'Software & Tools',
    justification: 'x',
    urgency: 'Low',
    vendor: undefined,
  }

  test('accepts the smallest valid submission', () => {
    expect(BudgetRequestSchema.safeParse(minValid).success).toBe(true)
  })

  test('rejects empty title', () => {
    expect(BudgetRequestSchema.safeParse({ ...minValid, title: '' }).success).toBe(false)
  })

  test('rejects zero amount', () => {
    expect(BudgetRequestSchema.safeParse({ ...minValid, amount: 0 }).success).toBe(false)
  })

  test('rejects negative amount', () => {
    expect(BudgetRequestSchema.safeParse({ ...minValid, amount: -1 }).success).toBe(false)
  })

  test('rejects unknown category', () => {
    expect(BudgetRequestSchema.safeParse({ ...minValid, category: 'Gifts' }).success).toBe(false)
  })
})

describe('LeaveRequestSchema — accepts minimum form-valid data', () => {
  const minValid = {
    leave_type: 'Annual Leave',
    date_range: { from: '2026-06-15T00:00:00.000Z', to: '2026-06-20T00:00:00.000Z' },
    reason: 'x',             // single char — form only requires non-empty
    handover_notes: undefined,
  }

  test('accepts the smallest valid submission', () => {
    expect(LeaveRequestSchema.safeParse(minValid).success).toBe(true)
  })

  test('rejects empty reason — matches form required check', () => {
    expect(LeaveRequestSchema.safeParse({ ...minValid, reason: '' }).success).toBe(false)
  })

  test('rejects unknown leave type', () => {
    expect(LeaveRequestSchema.safeParse({ ...minValid, leave_type: 'Maternity Leave' }).success).toBe(false)
  })

  test('rejects missing date_range.to', () => {
    expect(LeaveRequestSchema.safeParse({
      ...minValid,
      date_range: { from: '2026-06-15T00:00:00.000Z' },
    }).success).toBe(false)
  })

  test('rejects date_range where from > to', () => {
    expect(LeaveRequestSchema.safeParse({
      ...minValid,
      date_range: { from: '2026-06-20T00:00:00.000Z', to: '2026-06-15T00:00:00.000Z' },
    }).success).toBe(false)
  })

  test('same-day range (from === to) is valid', () => {
    expect(LeaveRequestSchema.safeParse({
      ...minValid,
      date_range: { from: '2026-06-15T00:00:00.000Z', to: '2026-06-15T00:00:00.000Z' },
    }).success).toBe(true)
  })
})
