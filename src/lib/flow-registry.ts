import { FlowConfig } from '@/types/flow.types'
import { BudgetRequestConfig } from '@/flows/budget-request/config'
import { LeaveRequestConfig } from '@/flows/leave-request/config'

export const FLOW_REGISTRY: FlowConfig[] = [
  BudgetRequestConfig,
  LeaveRequestConfig,
]

export function getFlow(id: string): FlowConfig | undefined {
  return FLOW_REGISTRY.find((f) => f.id === id)
}
