import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getFlow } from '@/lib/flow-registry'
import { getSchema } from '@/lib/schema-registry'
import { getApprover } from '@/lib/approval-router'
import { logStatusChange } from '@/lib/audit'
import { createNotification, buildNotification } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  // 1. Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
      { status: 401 }
    )
  }

  // 2. Role from DB
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

  // 3. Parse body
  const body = await req.json()
  const { flow_type, form_data, status = 'draft', idempotency_key } = body

  if (!flow_type || !form_data) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'flow_type and form_data are required' } },
      { status: 422 }
    )
  }

  // 4. Validate flow exists
  const flow = getFlow(flow_type)
  if (!flow) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: `Unknown flow type: ${flow_type}` } },
      { status: 404 }
    )
  }

  // 5. Validate form_data with Zod schema (only on submit, not draft)
  if (status === 'pending') {
    const schema = getSchema(flow_type)
    if (schema) {
      const result = schema.safeParse(form_data)
      if (!result.success) {
        return NextResponse.json(
          { error: { code: 'VALIDATION', message: 'Invalid form data', details: result.error.issues } },
          { status: 422 }
        )
      }
    }
  }

  // 6. Get approver (only for submissions)
  let approver_id: string | null = null
  if (status === 'pending') {
    const { approverId } = await getApprover(user.id, supabase)
    approver_id = approverId
  }

  // 7. Upsert with idempotency key
  const { data: request, error: upsertError } = await supabase
    .from('requests')
    .upsert(
      {
        flow_type,
        requester_id: user.id,
        approver_id,
        status,
        form_data,
        idempotency_key: idempotency_key ?? null,
      },
      { onConflict: 'idempotency_key', ignoreDuplicates: false }
    )
    .select()
    .single()

  if (upsertError || !request) {
    console.error('[POST /api/requests] upsert error:', upsertError)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to save request' } },
      { status: 500 }
    )
  }

  // 8. On submission: audit + notify + trigger AI summary
  if (status === 'pending') {
    await logStatusChange(request.id, user.id, 'draft', 'pending', null, supabase)

    if (approver_id) {
      const { title, message } = buildNotification(
        'request_pending_review',
        profile.name,
        flow.label
      )
      await createNotification(approver_id, request.id, 'request_pending_review', title, message, supabase)
    }

    // Fire-and-forget AI summary — don't await, don't block response
    fetch(`${req.nextUrl.origin}/api/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: req.headers.get('cookie') ?? '' },
      body: JSON.stringify({ request_id: request.id }),
    }).catch(() => {})
  }

  return NextResponse.json({ data: request }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const supabase = createServerClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: 'Please log in' } },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const flow_type = searchParams.get('flow_type')
  const status = searchParams.get('status')

  let query = supabase
    .from('requests')
    .select('*')
    .eq('requester_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (flow_type) query = query.eq('flow_type', flow_type)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to fetch requests' } },
      { status: 500 }
    )
  }

  return NextResponse.json({ data })
}
