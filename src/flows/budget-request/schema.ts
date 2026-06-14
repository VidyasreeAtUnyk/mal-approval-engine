import { z } from 'zod'

const CATEGORIES = [
  'Software & Tools',
  'Hardware',
  'Travel & Accommodation',
  'Training & Development',
  'Marketing',
  'Operations',
  'Other',
] as const

const URGENCIES = ['Low', 'Medium', 'High', 'Critical'] as const

export const BudgetRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be 100 characters or less'),

  amount: z.number().positive('Amount must be greater than zero'),

  category: z.enum(CATEGORIES, { error: 'Please select a category' }),

  justification: z
    .string()
    .min(1, 'Justification is required')
    .max(1000, 'Maximum 1000 characters'),

  urgency: z.enum(URGENCIES, { error: 'Please select urgency' }),

  vendor: z.string().max(200, 'Maximum 200 characters').optional(),
})

export type BudgetRequestData = z.infer<typeof BudgetRequestSchema>
