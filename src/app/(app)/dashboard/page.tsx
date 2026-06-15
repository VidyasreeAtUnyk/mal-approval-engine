import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { RequestCard } from '@/engine/RequestCard'
import { Request } from '@/types/flow.types'
import { FLOW_REGISTRY } from '@/lib/flow-registry'
import { NewRequestMenu } from '@/components/layout/NewRequestMenu'
import { Inbox } from 'lucide-react'

export default async function EmployeeDashboard() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: requests } = await supabase
    .from('requests')
    .select('*')
    .eq('requester_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const all = (requests ?? []) as Request[]
  const pending = all.filter(r => r.status === 'pending')
  const approved = all.filter(r => r.status === 'approved')
  const rejected = all.filter(r => r.status === 'rejected')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--mal-text-strong-950)]">My Requests</h1>
          <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">Track all your submitted requests</p>
        </div>
        <NewRequestMenu flows={FLOW_REGISTRY.map(f => ({ id: f.id, label: f.label }))} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
        {[
          { label: 'Pending', count: pending.length, color: 'text-[var(--mal-purple-500)]' },
          { label: 'Approved', count: approved.length, color: 'text-green-600' },
          { label: 'Rejected', count: rejected.length, color: 'text-red-500' },
        ].map(({ label, count, color }) => (
          <div key={label}
            className="rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] p-4 text-center shadow-mal-xs">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-[var(--mal-text-soft-400)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Request list */}
      {all.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-10 w-10 text-[var(--mal-text-soft-400)] mb-3" />
          <p className="text-sm font-medium text-[var(--mal-text-sub-600)]">No requests yet</p>
          <p className="text-xs text-[var(--mal-text-soft-400)] mt-1">Submit your first request to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {all.map(r => (
            <RequestCard key={r.id} request={r} href={`/${r.flow_type}/${r.id}`} />
          ))}
        </div>
      )}
    </div>
  )
}
