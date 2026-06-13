import { ZodSchema } from 'zod'
import { BudgetRequestSchema } from '@/flows/budget-request/schema'
import { LeaveRequestSchema } from '@/flows/leave-request/schema'

const SCHEMA_REGISTRY: Record<string, ZodSchema> = {
  'budget-request': BudgetRequestSchema,
  'leave-request': LeaveRequestSchema,
}

export function getSchema(flowType: string): ZodSchema | undefined {
  return SCHEMA_REGISTRY[flowType]
}
