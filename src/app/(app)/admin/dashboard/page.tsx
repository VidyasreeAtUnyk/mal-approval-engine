import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { RequestCard } from '@/engine/RequestCard'
import { Request } from '@/types/flow.types'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { FLOW_REGISTRY } from '@/lib/flow-registry'
import { FilterBar } from '@/components/admin/FilterBar'

interface SearchParams {
  dept?: string
  flow?: string
  status?: string
  date?: string
}

type RequestWithProfile = Request & {
  profiles: { department_id: string | null } | null
}

function avgDecisionHours(requests: Request[]): number | null {
  const decided = requests.filter(r => r.status === 'approved' || r.status === 'rejected')
  if (!decided.length) return null
  const totalMs = decided.reduce((sum, r) => {
    return sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime())
  }, 0)
  return Math.round(totalMs / decided.length / (1000 * 60 * 60))
}

function formatAvg(hours: number | null): string {
  if (hours === null) return '—'
  if (hours < 24) return `${hours}h`
  return `${Math.round(hours / 24)}d`
}

async function AdminDashboardContent({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: allRequests }, { data: departments }] = await Promise.all([
    supabase
      .from('requests')
      .select('*, profiles!requests_requester_id_fkey(department_id)')
      .is('deleted_at', null)
      .neq('status', 'draft')
      .order('created_at', { ascending: false }),
    supabase
      .from('departments')
      .select('id, name')
      .order('name'),
  ])

  const requests = (allRequests ?? []) as RequestWithProfile[]
  const depts = (departments ?? []) as { id: string; name: string }[]

  // Apply filters (AND conditions)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  let filtered = requests

  if (searchParams.dept)
    filtered = filtered.filter(r => r.profiles?.department_id === searchParams.dept)
  if (searchParams.flow)
    filtered = filtered.filter(r => r.flow_type === searchParams.flow)
  if (searchParams.status)
    filtered = filtered.filter(r => r.status === searchParams.status)
  if (searchParams.date === 'week')
    filtered = filtered.filter(r => new Date(r.created_at) >= weekAgo)
  else if (searchParams.date === 'month')
    filtered = filtered.filter(r => new Date(r.created_at) >= monthStart)

  // Stats (all from filtered set)
  const pendingCount = filtered.filter(r => r.status === 'pending').length
  const approvedMonth = filtered.filter(r => r.status === 'approved' && new Date(r.updated_at) >= monthStart).length
  const rejectedMonth = filtered.filter(r => r.status === 'rejected' && new Date(r.updated_at) >= monthStart).length
  const avgHours = avgDecisionHours(filtered)

  const hasFilters = searchParams.dept || searchParams.flow || searchParams.status || searchParams.date
  const byFlow = FLOW_REGISTRY.map(flow => ({
    flow,
    requests: filtered.filter(r => r.flow_type === flow.id),
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--mal-text-strong-950)]">Admin Dashboard</h1>
        <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">All requests across the organisation</p>
      </div>

      {/* Filter bar */}
      <FilterBar
        departments={depts}
        flows={FLOW_REGISTRY.map(f => ({ id: f.id, label: f.label }))}
        current={searchParams}
      />

      {/* Showing count */}
      {hasFilters && (
        <p className="text-xs text-[var(--mal-text-soft-400)]">
          Showing <span className="font-medium text-[var(--mal-text-sub-600)]">{filtered.length}</span> of {requests.length} requests
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: pendingCount, color: 'text-[var(--mal-purple-500)]' },
          { label: 'Approved (month)', value: approvedMonth, color: 'text-green-600' },
          { label: 'Rejected (month)', value: rejectedMonth, color: 'text-red-500' },
          { label: 'Avg decision', value: formatAvg(avgHours), color: 'text-[var(--mal-text-sub-600)]' },
        ].map(({ label, value, color }) => (
          <div key={label}
            className="rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] p-4 text-center shadow-mal-xs">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-[var(--mal-text-soft-400)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Requests by flow */}
      {byFlow.map(({ flow, requests: flowRequests }) => {
        if (flowRequests.length === 0) return null
        return (
          <section key={flow.id}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)]">{flow.label}</h2>
              <span className="text-xs text-[var(--mal-text-soft-400)]">{flowRequests.length}</span>
            </div>
            <div className="space-y-2">
              {flowRequests.map(r => (
                <RequestCard key={r.id} request={r} href={`/admin/request/${r.id}`} />
              ))}
            </div>
          </section>
        )
      })}

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-[var(--mal-text-sub-600)]">
            {hasFilters ? 'No requests match the selected filters' : 'No requests submitted yet'}
          </p>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard({ searchParams }: { searchParams: SearchParams }) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <AdminDashboardContent searchParams={searchParams} />
    </RoleGuard>
  )
}
