import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getFlow } from '@/lib/flow-registry'
import { logStatusChange } from '@/lib/audit'
import { createNotification, buildNotification } from '@/lib/notifications'
import { requiresApproverFilter, canReview } from '@/lib/request-permissions'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient()

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
      { status: 401 }
    )
  }

  // 2. Role from DB — must be manager or admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Account not active' } },
      { status: 401 }
    )
  }

  if (!canReview(profile.role)) {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
      { status: 403 }
    )
  }

  // 3. Fetch the request — admin can approve any pending request, managers only their own
  let fetchQuery = supabase
    .from('requests')
    .select('*, profiles!requests_requester_id_fkey(name)')
    .eq('id', params.id)
    .eq('status', 'pending')

  if (requiresApproverFilter(profile.role)) {
    fetchQuery = fetchQuery.eq('approver_id', user.id)
  }

  const { data: request, error: fetchError } = await fetchQuery.single()

  if (fetchError || !request) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Request not found or not pending' } },
      { status: 404 }
    )
  }

  // 4. Parse optional note
  const body = await req.json().catch(() => ({}))
  const note: string | null = body.note?.trim() || null

  // 5. Update status
  const { error: updateError } = await supabase
    .from('requests')
    .update({ status: 'approved', approver_note: note })
    .eq('id', params.id)

  if (updateError) {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to approve request' } },
      { status: 500 }
    )
  }

  // 6. Audit + notify requester
  await logStatusChange(params.id, user.id, 'pending', 'approved', note, supabase)

  const flow = getFlow(request.flow_type)
  const requesterName = (request.profiles as { name: string } | null)?.name ?? 'User'
  const { title, message } = buildNotification(
    'request_approved',
    requesterName,
    flow?.label ?? request.flow_type,
    note ?? undefined
  )
  await createNotification(request.requester_id, params.id, 'request_approved', title, message, supabase)

  return NextResponse.json({ data: { status: 'approved' } })
}
