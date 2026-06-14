import { z } from 'zod'

const LEAVE_TYPES = [
  'Annual Leave',
  'Sick Leave',
  'Emergency Leave',
  'Unpaid Leave',
] as const

export const LeaveRequestSchema = z.object({
  leave_type: z.enum(LEAVE_TYPES, { error: 'Please select leave type' }),

  date_range: z
    .object({
      from: z.string().min(1, 'Start date required'),
      to: z.string().min(1, 'End date required'),
    })
    .refine((data) => new Date(data.from) <= new Date(data.to), {
      message: 'End date must be on or after start date',
    }),

  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Maximum 500 characters'),

  handover_notes: z.string().max(500, 'Maximum 500 characters').optional(),
})

export type LeaveRequestData = z.infer<typeof LeaveRequestSchema>
