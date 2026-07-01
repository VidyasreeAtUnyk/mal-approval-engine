'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getFlow } from '@/lib/flow-registry'
import { ApprovalForm } from '@/engine/ApprovalForm'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'

export default function NewRequestPage() {
  const { flowType } = useParams<{ flowType: string }>()
  const router = useRouter()
  const flow = getFlow(flowType)

  const [initialData, setInitialData] = useState<Record<string, unknown> | undefined>()
  const [draftId, setDraftId] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(true)
  const idempotencyKey = useRef(crypto.randomUUID())

  // Load existing draft on mount.
  // Fetch the latest request regardless of status — only restore if it is
  // still a draft. If it was already submitted (pending/approved/rejected),
  // the form opens blank. This prevents a stale draft surfacing when the
  // DELETE cleanup after submission fails or races.
  useEffect(() => {
    if (!flow) return
    fetch(`/api/requests?flow_type=${flowType}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(({ data }) => {
        const latest = data?.[0]
        if (latest && latest.status === 'draft') {
          setDraftId(latest.id)
          setInitialData(latest.form_data)
          // Reuse the draft's idempotency key so we upsert over it
          if (latest.idempotency_key) {
            idempotencyKey.current = latest.idempotency_key
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDraft(false))
  }, [flowType, flow])

  async function saveDraft(data: Record<string, unknown>) {
    const { _idempotencyKey, ...formData } = data
    await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        flow_type: flowType,
        form_data: formData,
        status: 'draft',
        idempotency_key: _idempotencyKey ?? idempotencyKey.current,
      }),
    }).catch(() => {})
  }

  async function handleSubmit(data: Record<string, unknown>) {
    const { _idempotencyKey, ...formData } = data
    setSubmitting(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_type: flowType,
          form_data: formData,
          status: 'pending',
          idempotency_key: _idempotencyKey ?? idempotencyKey.current,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        const firstIssue = json.error?.details?.[0]
        const msg = firstIssue
          ? `${firstIssue.path?.join('.') ?? 'Field'}: ${firstIssue.message}`
          : (json.error?.message ?? 'Submission failed.')
        toast.error(msg)
        return
      }

      // Clean up all drafts for this flow so the form opens blank next time
      await fetch(`/api/requests?flow_type=${flowType}&status=draft`, { method: 'DELETE' }).catch(() => {})

      // Clear local state and router cache so navigating back shows a blank form
      setInitialData(undefined)
      setDraftId(undefined)
      router.refresh()

      toast.success('Request submitted successfully!')
      router.push(`/${flowType}/${json.data.id}`)
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!flow) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center">
        <p className="text-sm text-[var(--mal-text-sub-600)]">Unknown flow type: {flowType}</p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--mal-text-strong-950)]">{flow.label}</h1>
        <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">{flow.description}</p>
        {draftId && (
          <p className="text-xs text-[var(--mal-purple-500)] mt-1">Draft restored — continue where you left off.</p>
        )}
      </div>

      {loadingDraft ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <ApprovalForm
          config={flow}
          initialData={initialData}
          draftId={draftId}
          onSubmit={handleSubmit}
          onDraftSave={saveDraft}
          submitting={submitting}
        />
      )}
    </div>
  )
}
