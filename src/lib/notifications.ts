import { SupabaseClient } from '@supabase/supabase-js'
import { NotificationType } from '@/types/flow.types'

export async function createNotification(
  userId: string,
  requestId: string,
  type: NotificationType,
  title: string,
  message: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    request_id: requestId,
    type,
    title,
    message,
  })

  if (error) {
    // Non-critical — log but never block the main flow
    console.error('[notifications] createNotification failed:', error.message)
  }
}

export function buildNotification(
  type: NotificationType,
  requesterName: string,
  flowLabel: string,
  approverNote?: string
): { title: string; message: string } {
  switch (type) {
    case 'request_pending_review':
      return {
        title: `New ${flowLabel}`,
        message: `${requesterName} submitted a ${flowLabel.toLowerCase()} awaiting your review.`,
      }
    case 'request_approved':
      return {
        title: `${flowLabel} Approved`,
        message: approverNote
          ? `Your request was approved. Note: ${approverNote}`
          : `Your ${flowLabel.toLowerCase()} has been approved.`,
      }
    case 'request_rejected':
      return {
        title: `${flowLabel} Rejected`,
        message: approverNote
          ? `Your request was rejected. Reason: ${approverNote}`
          : `Your ${flowLabel.toLowerCase()} was not approved.`,
      }
    case 'request_submitted':
      return {
        title: `${flowLabel} Submitted`,
        message: `Your ${flowLabel.toLowerCase()} has been submitted and is pending review.`,
      }
  }
}
