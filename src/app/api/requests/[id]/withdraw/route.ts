import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase-server'
import { canWithdraw } from '@/lib/request-permissions'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
      { status: 401 }
    )
  }

  // Only the requester can withdraw, and only while still pending or draft
  const { data: request } = await supabase
    .from('requests')
    .select('id, status, requester_id')
    .eq('id', params.id)
    .eq('requester_id', user.id)
    .single()

  if (!request) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Request not found' } },
      { status: 404 }
    )
  }

  if (!canWithdraw(request.status)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Only pending or draft requests can be withdrawn' } },
      { status: 403 }
    )
  }

  // Use service client to bypass RLS for the soft-delete update
  const svc = createServiceClient()
  const { error } = await svc
    .from('requests')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('requester_id', user.id) // belt-and-suspenders: still scope to requester

  if (error) {
    console.error('[withdraw] update error:', error)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to withdraw request' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data: { withdrawn: true } })
}
