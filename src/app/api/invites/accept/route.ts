import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { z } from 'zod'

const AcceptSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Full name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()

  const body = await req.json().catch(() => ({}))
  const result = AcceptSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: result.error.issues[0]?.message ?? 'Invalid input' } },
      { status: 422 }
    )
  }

  const { token, name, password } = result.data

  // 1. Look up invite
  const { data: invite, error: inviteError } = await supabase
    .from('invites')
    .select('*')
    .eq('token', token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'Invalid invite link.' } },
      { status: 404 }
    )
  }

  if (invite.accepted_at) {
    return NextResponse.json(
      { error: { code: 'ALREADY_USED', message: 'This invite has already been used.' } },
      { status: 409 }
    )
  }

  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json(
      { error: { code: 'EXPIRED', message: 'This invite has expired.' } },
      { status: 410 }
    )
  }

  // 2. Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: invite.email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    const message = authError?.message?.includes('already registered')
      ? 'An account with this email already exists.'
      : 'Failed to create account. Please try again.'
    return NextResponse.json(
      { error: { code: 'AUTH_ERROR', message } },
      { status: 500 }
    )
  }

  const userId = authData.user.id

  // 3. Insert profile
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email: invite.email,
    name,
    role: invite.role,
    department_id: invite.department_id ?? null,
    manager_id: invite.manager_id ?? null,
    is_active: true,
  })

  if (profileError) {
    // Roll back auth user to avoid orphan
    await supabase.auth.admin.deleteUser(userId)
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to create profile. Please try again.' } },
      { status: 500 }
    )
  }

  // 4. Mark invite as accepted
  await supabase
    .from('invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token)

  return NextResponse.json({ data: { role: invite.role } }, { status: 201 })
}
