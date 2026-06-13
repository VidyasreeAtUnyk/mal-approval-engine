import { SupabaseClient } from '@supabase/supabase-js'
import { RequestStatus } from '@/types/flow.types'

export async function logStatusChange(
  requestId: string,
  changedBy: string,
  fromStatus: RequestStatus | null,
  toStatus: RequestStatus,
  note: string | null,
  supabase: SupabaseClient
): Promise<void> {
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
