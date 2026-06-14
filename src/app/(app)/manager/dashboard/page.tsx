import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { RequestCard } from '@/engine/RequestCard'
import { Request } from '@/types/flow.types'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { CheckSquare } from 'lucide-react'

async function ManagerDashboardContent() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin'

  // Pending requests where this user is the approver
  const { data: pending } = await supabase
    .from('requests')
    .select('*')
    .eq('approver_id', user.id)
    .eq('status', 'pending')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  // Resolved requests
  const { data: resolved } = await supabase
    .from('requests')
    .select('*')
    .eq('approver_id', user.id)
    .in('status', ['approved', 'rejected'])
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })
    .limit(10)

  const pendingList = (pending ?? []) as Request[]
  const resolvedList = (resolved ?? []) as Request[]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[var(--mal-text-strong-950)]">
          {isAdmin ? 'My Approvals' : 'Approvals'}
        </h1>
        <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">
          {isAdmin
            ? 'Manager requests routed to you for final approval'
            : 'Requests from your team awaiting review'}
        </p>
      </div>

      {/* Pending */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)]">Pending Review</h2>
          {pendingList.length > 0 && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)]">
              {pendingList.length}
            </span>
          )}
        </div>
        {pendingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-mal-10 border border-dashed border-[var(--mal-stroke-soft-200)]">
            <CheckSquare className="h-8 w-8 text-[var(--mal-text-soft-400)] mb-2" />
            <p className="text-sm text-[var(--mal-text-sub-600)]">All caught up!</p>
            <p className="text-xs text-[var(--mal-text-soft-400)] mt-0.5">
              {isAdmin
                ? 'Requests submitted by managers will appear here'
                : 'Requests submitted by your team will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingList.map(r => (
              <RequestCard key={r.id} request={r} href={`/manager/request/${r.id}`} />
            ))}
          </div>
        )}
      </section>

      {/* Recently resolved */}
      {resolvedList.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--mal-text-strong-950)] mb-3">Recently Resolved</h2>
          <div className="space-y-2">
            {resolvedList.map(r => (
              <RequestCard key={r.id} request={r} href={`/manager/request/${r.id}`} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function ManagerDashboard() {
  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      <ManagerDashboardContent />
    </RoleGuard>
  )
}
