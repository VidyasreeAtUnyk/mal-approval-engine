import { LeaveRequestSchema } from './schema'

const valid = {
  leave_type: 'Annual Leave' as const,
  date_range: { from: '2026-07-01', to: '2026-07-05' },
  reason: 'Family vacation planned for summer.',
}

describe('LeaveRequestSchema', () => {
  describe('valid submissions', () => {
    test('complete valid form passes', () => {
      expect(LeaveRequestSchema.safeParse(valid).success).toBe(true)
    })

    test('handover_notes optional', () => {
      expect(LeaveRequestSchema.safeParse({ ...valid, handover_notes: undefined }).success).toBe(true)
    })
  })

  describe('date_range', () => {
    test('valid date range passes', () => {
      expect(LeaveRequestSchema.safeParse(valid).success).toBe(true)
    })

    test('end date before start date fails', () => {
      const result = LeaveRequestSchema.safeParse({
        ...valid,
        date_range: { from: '2026-07-10', to: '2026-07-05' },
      })
      expect(result.success).toBe(false)
    })

    test('same day start and end passes', () => {
      expect(LeaveRequestSchema.safeParse({
        ...valid,
        date_range: { from: '2026-07-01', to: '2026-07-01' },
      }).success).toBe(true)
    })

    test('missing from date fails', () => {
      expect(LeaveRequestSchema.safeParse({
        ...valid,
        date_range: { from: '', to: '2026-07-05' },
      }).success).toBe(false)
    })

    test('missing to date fails', () => {
      expect(LeaveRequestSchema.safeParse({
        ...valid,
        date_range: { from: '2026-07-01', to: '' },
      }).success).toBe(false)
    })
  })

  describe('leave_type', () => {
    test('valid types pass', () => {
      for (const t of ['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Unpaid Leave']) {
        expect(LeaveRequestSchema.safeParse({ ...valid, leave_type: t }).success).toBe(true)
      }
    })

    test('invalid type fails', () => {
      expect(LeaveRequestSchema.safeParse({ ...valid, leave_type: 'Maternity Leave' }).success).toBe(false)
    })
  })

  describe('reason', () => {
    test('empty string fails', () => {
      expect(LeaveRequestSchema.safeParse({ ...valid, reason: '' }).success).toBe(false)
    })

    test('any non-empty reason passes', () => {
      expect(LeaveRequestSchema.safeParse({ ...valid, reason: 'sick' }).success).toBe(true)
    })

    test('over 500 chars fails', () => {
      expect(LeaveRequestSchema.safeParse({ ...valid, reason: 'a'.repeat(501) }).success).toBe(false)
    })
  })
})
