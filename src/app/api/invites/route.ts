import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['employee', 'manager', 'admin'], { error: 'Invalid role' }),
  department_id: z.string().nullable().optional(),
  manager_id: z.string().nullable().optional(),
})

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

  // 2. Admin only
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile?.is_active || profile.role !== 'admin') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN', message: 'Admin access required' } },
      { status: 403 }
    )
  }

  // 3. Validate
  const body = await req.json()
  const result = InviteSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION', message: 'Invalid input', details: result.error.issues } },
      { status: 422 }
    )
  }

  const { email, role, department_id, manager_id } = result.data

  // 4. Create invite record
  const token = randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error: insertError } = await supabase.from('invites').insert({
    email,
    role,
    department_id: department_id ?? null,
    manager_id: manager_id ?? null,
    invited_by: user.id,
    token,
    expires_at: expiresAt,
  })

  if (insertError) {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'Failed to create invite' } },
      { status: 500 }
    )
  }

  // 5. Log invite link (email delivery is a production next step)
  const inviteUrl = `${req.nextUrl.origin}/invite/${token}`
  console.log(`[invites] Invite created for ${email} (${role}): ${inviteUrl}`)

  return NextResponse.json({ data: { email, role, token, expires_at: expiresAt } }, { status: 201 })
}
