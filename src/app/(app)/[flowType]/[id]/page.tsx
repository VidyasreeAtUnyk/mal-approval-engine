import { createServerClient } from '@/lib/supabase-server'
import { redirect, notFound } from 'next/navigation'
import { getFlow } from '@/lib/flow-registry'
import { StatusBadge } from '@/engine/StatusBadge'
import { AIInsight } from '@/engine/AIInsight'
import { Request, AuditEntry } from '@/types/flow.types'
import { formatDistanceToNow, format } from 'date-fns'
import { formatDateRange } from '@/lib/format'
import { Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Separator } from '@/components/ui/separator'
import { WithdrawButton } from '@/engine/WithdrawButton'
import { RequestStatusWatcher } from '@/engine/RequestStatusWatcher'

export default async function RequestDetailPage({
  params,
}: {
  params: { flowType: string; id: string }
}) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: request } = await supabase
    .from('requests')
    .select('*')
    .eq('id', params.id)
    .eq('requester_id', user.id)
    .single()

  if (!request) notFound()

  const { data: auditRows } = await supabase
    .from('request_audit_log')
    .select('*')
    .eq('request_id', params.id)
    .order('changed_at', { ascending: true })

  const req = request as Request
  const audit = (auditRows ?? []) as AuditEntry[]
  const flow = getFlow(req.flow_type)
  const formData = req.form_data as Record<string, unknown>

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <RequestStatusWatcher requestId={req.id} />
      {/* Back */}
      <Link href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--mal-text-sub-600)] hover:text-[var(--mal-text-strong-950)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        My Requests
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--mal-text-soft-400)] uppercase tracking-wide mb-1">
            {flow?.label ?? req.flow_type}
          </p>
          <h1 className="text-xl font-semibold text-[var(--mal-text-strong-950)]">
            {(formData.title as string) ?? (formData.leave_type as string) ?? 'Request'}
          </h1>
          <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">
            Submitted {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
          </p>
        </div>
        <StatusBadge status={req.status} />
      </div>

      {/* Withdraw — only while awaiting review */}
      {(req.status === 'pending' || req.status === 'draft') && (
        <WithdrawButton requestId={req.id} />
      )}

      {/* AI Insight */}
      <AIInsight summary={req.ai_summary} flags={req.ai_flags as string[] | null} />

      {/* Approver note */}
      {req.approver_note && (
        <div className="rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-weak-50)] p-4">
          <p className="text-xs text-[var(--mal-text-soft-400)] mb-1">
            {req.status === 'approved' ? 'Approver note' : 'Rejection reason'}
          </p>
          <p className="text-sm text-[var(--mal-text-strong-950)]">{req.approver_note}</p>
        </div>
      )}

      <Separator className="bg-[var(--mal-stroke-soft-200)]" />

      {/* Form data */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)]">Request Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flow?.fields.map(f => {
            const val = formData[f.id]
            if (val === undefined || val === null || val === '') return null
            let display: string
            if (f.type === 'daterange') {
              display = formatDateRange(val)
            } else if (f.id === 'amount') {
              display = `AED ${Number(val).toLocaleString()}`
            } else if (typeof val === 'object') {
              display = JSON.stringify(val)
            } else {
              display = String(val)
            }
            return (
              <div key={f.id} className="space-y-0.5">
                <dt className="text-xs text-[var(--mal-text-soft-400)]">{f.label}</dt>
                <dd className="text-sm text-[var(--mal-text-strong-950)] font-medium">{display}</dd>
              </div>
            )
          })}
        </dl>
      </div>

      {/* Audit log */}
      {audit.length > 0 && (
        <>
          <Separator className="bg-[var(--mal-stroke-soft-200)]" />
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)]">History</h2>
            <ol className="space-y-3">
              {audit.map(entry => (
                <li key={entry.id} className="flex gap-3">
                  <Clock className="h-4 w-4 text-[var(--mal-text-soft-400)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-[var(--mal-text-strong-950)]">
                      Status changed to{' '}
                      <span className="font-medium capitalize">{entry.to_status}</span>
                    </p>
                    {entry.note && (
                      <p className="text-xs text-[var(--mal-text-sub-600)] mt-0.5">&ldquo;{entry.note}&rdquo;</p>
                    )}
                    <p className="text-xs text-[var(--mal-text-soft-400)] mt-0.5">
                      {format(new Date(entry.changed_at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  )
}
