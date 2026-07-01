import { createServiceClient } from '@/lib/supabase-server'
import { RequestStatus } from '@/types/flow.types'

export async function logStatusChange(
  requestId: string,
  changedBy: string,
  fromStatus: RequestStatus | null,
  toStatus: RequestStatus,
  note: string | null,
): Promise<void> {
  const supabase = createServiceClient()
  const { error } = await supabase.from('request_audit_log').insert({
    request_id: requestId,
    changed_by: changedBy,
    from_status: fromStatus,
    to_status: toStatus,
    note,
  })

  if (error) {
    console.error('[audit] logStatusChange failed:', error.message)
  }
}
