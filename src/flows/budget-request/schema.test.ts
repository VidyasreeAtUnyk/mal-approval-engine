import { BudgetRequestSchema } from './schema'

const valid = {
  title: 'New laptop for development',
  amount: 5000,
  category: 'Hardware' as const,
  justification: 'Current laptop is 5 years old and causing productivity issues.',
  urgency: 'High' as const,
}

describe('BudgetRequestSchema', () => {
  describe('valid submissions', () => {
    test('complete valid form passes', () => {
      expect(BudgetRequestSchema.safeParse(valid).success).toBe(true)
    })

    test('optional vendor can be omitted', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, vendor: undefined }).success).toBe(true)
    })

    test('optional vendor can be provided', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, vendor: 'Apple Inc' }).success).toBe(true)
    })
  })

  describe('title', () => {
    test('empty title fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, title: '' }).success).toBe(false)
    })

    test('title over 100 chars fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, title: 'a'.repeat(101) }).success).toBe(false)
    })

    test('title at exactly 100 chars passes', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, title: 'a'.repeat(100) }).success).toBe(true)
    })
  })

  describe('amount', () => {
    test('positive amount passes', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, amount: 1 }).success).toBe(true)
    })

    test('negative amount fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, amount: -100 }).success).toBe(false)
    })

    test('zero amount fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false)
    })

    test('non-number fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, amount: 'five hundred' }).success).toBe(false)
    })
  })

  describe('category', () => {
    test('valid category passes', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, category: 'Software & Tools' }).success).toBe(true)
    })

    test('invalid category fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, category: 'Snacks' }).success).toBe(false)
    })
  })

  describe('justification', () => {
    test('too short fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, justification: 'short' }).success).toBe(false)
    })

    test('too long fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, justification: 'a'.repeat(1001) }).success).toBe(false)
    })

    test('minimum 10 chars passes', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, justification: 'a'.repeat(10) }).success).toBe(true)
    })
  })

  describe('urgency', () => {
    test('valid urgency passes', () => {
      for (const u of ['Low', 'Medium', 'High', 'Critical']) {
        expect(BudgetRequestSchema.safeParse({ ...valid, urgency: u }).success).toBe(true)
      }
    })

    test('invalid urgency fails', () => {
      expect(BudgetRequestSchema.safeParse({ ...valid, urgency: 'Extreme' }).success).toBe(false)
    })
  })
})
