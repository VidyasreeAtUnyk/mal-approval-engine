import { createServerClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { ApproverView } from '@/engine/ApproverView'
import { Request, AuditEntry } from '@/types/flow.types'
import { RoleGuard } from '@/components/layout/RoleGuard'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function AdminRequestContent({ id }: { id: string }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase
    .from('requests')
    .select('*, profiles!requests_requester_id_fkey(name, email)')
    .eq('id', id)
    .single()

  if (!request) notFound()

  const { data: auditRows } = await supabase
    .from('request_audit_log')
    .select('*')
    .eq('request_id', id)
    .order('changed_at', { ascending: true })

  const req = request as Request & { profiles: { name: string; email: string } | null }
  const audit = (auditRows ?? []) as AuditEntry[]

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Link href="/admin/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--mal-text-sub-600)] hover:text-[var(--mal-text-strong-950)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Admin Dashboard
      </Link>
      <ApproverView
        request={req}
        auditLog={audit}
        requesterName={req.profiles?.name}
      />
    </div>
  )
}

export default function AdminRequestPage({ params }: { params: { id: string } }) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminRequestContent id={params.id} />
    </RoleGuard>
  )
}
