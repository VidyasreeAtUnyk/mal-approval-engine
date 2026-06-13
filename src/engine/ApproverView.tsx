'use client'

import { useState } from 'react'
import { Request, AuditEntry } from '@/types/flow.types'
import { getFlow } from '@/lib/flow-registry'
import { StatusBadge } from './StatusBadge'
import { AIInsight } from './AIInsight'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { formatDistanceToNow, format } from 'date-fns'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ApproverViewProps {
  request: Request
  auditLog?: AuditEntry[]
  requesterName?: string
}

export function ApproverView({ request, auditLog = [], requesterName }: ApproverViewProps) {
  const router = useRouter()
  const flow = getFlow(request.flow_type)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState('')
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const formData = request.form_data as Record<string, unknown>
  const isPending = request.status === 'pending'

  async function handleAction(action: 'approve' | 'reject') {
    if (action === 'reject' && !note.trim()) {
      setNoteError('A reason is required when rejecting.')
      return
    }
    setNoteError('')
    setLoading(action)

    try {
      const res = await fetch(`/api/requests/${request.id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() || null }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error?.message ?? 'Something went wrong.')
        return
      }

      toast.success(action === 'approve' ? 'Request approved.' : 'Request rejected.')
      router.refresh()
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--mal-text-soft-400)] uppercase tracking-wide mb-1">
            {flow?.label ?? request.flow_type}
          </p>
          <h1 className="text-lg font-semibold text-[var(--mal-text-strong-950)]">
            {(formData.title as string) ?? (formData.leave_type as string) ?? 'Request'}
          </h1>
          {requesterName && (
            <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">
              Submitted by {requesterName} · {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </p>
          )}
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* AI Insight */}
      <AIInsight
        summary={request.ai_summary}
        flags={request.ai_flags as string[] | null}
      />

      <Separator className="bg-[var(--mal-stroke-soft-200)]" />

      {/* Form data */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)]">Request Details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {flow?.fields.map((f) => {
            const val = formData[f.id]
            if (val === undefined || val === null || val === '') return null
            const display =
              typeof val === 'object'
                ? JSON.stringify(val)
                : String(val)

            return (
              <div key={f.id} className="space-y-0.5">
                <dt className="text-xs text-[var(--mal-text-soft-400)]">{f.label}</dt>
                <dd className="text-sm text-[var(--mal-text-strong-950)] font-medium">
                  {f.id === 'amount' ? `AED ${Number(val).toLocaleString()}` : display}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>

      {/* Approve / Reject */}
      {isPending && (
        <>
          <Separator className="bg-[var(--mal-stroke-soft-200)]" />
          <div className="space-y-3">
            <Label className="text-sm font-medium text-[var(--mal-text-strong-950)]">
              Note <span className="text-[var(--mal-text-soft-400)] font-normal">(required for rejection)</span>
            </Label>
            <Textarea
              value={note}
              onChange={(e) => { setNote(e.target.value); setNoteError('') }}
              placeholder="Add a note for the requester…"
              rows={3}
              className="border-[var(--mal-stroke-soft-200)] resize-none"
            />
            {noteError && <p className="text-xs text-destructive">{noteError}</p>}

            <div className="flex gap-3">
              <Button
                onClick={() => handleAction('approve')}
                disabled={loading !== null}
                className="bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {loading === 'approve' ? 'Approving…' : 'Approve'}
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('reject')}
                disabled={loading !== null}
                className="border-destructive text-destructive hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {loading === 'reject' ? 'Rejecting…' : 'Reject'}
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Audit log */}
      {auditLog.length > 0 && (
        <>
          <Separator className="bg-[var(--mal-stroke-soft-200)]" />
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)]">History</h2>
            <ol className="space-y-3">
              {auditLog.map((entry) => (
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
