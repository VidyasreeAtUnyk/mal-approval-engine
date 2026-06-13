import { SupabaseClient } from '@supabase/supabase-js'

export interface ApproverResult {
  approverId: string | null
  reason: 'manager' | 'admin' | 'self' | 'no_manager' | 'not_found'
}

export async function getApprover(
  requesterId: string,
  supabase: SupabaseClient
): Promise<ApproverResult> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, manager_id, is_active')
    .eq('id', requesterId)
    .single()

  if (error || !profile) {
    return { approverId: null, reason: 'not_found' }
  }

  // Admin approves their own requests
  if (profile.role === 'admin') {
    return { approverId: requesterId, reason: 'self' }
  }

  // Employee routes to their manager
  if (profile.role === 'employee') {
    if (!profile.manager_id) {
      return { approverId: null, reason: 'no_manager' }
    }
    return { approverId: profile.manager_id, reason: 'manager' }
  }

  // Manager routes to an admin
  if (profile.role === 'manager') {
    const { data: admin } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!admin) {
      return { approverId: null, reason: 'no_manager' }
    }
    return { approverId: admin.id, reason: 'admin' }
  }

  return { approverId: null, reason: 'not_found' }
}
