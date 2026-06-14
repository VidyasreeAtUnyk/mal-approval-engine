import { createServerClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Profile, Department } from '@/types/profile.types'
import Link from 'next/link'
import { UserPlus, Circle } from 'lucide-react'

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] border-[var(--mal-alpha-purple-24)]',
  manager: 'bg-blue-50 text-blue-700 border-blue-200',
  employee: 'bg-[var(--mal-bg-soft-200)] text-[var(--mal-text-sub-600)] border-[var(--mal-stroke-soft-200)]',
}

async function UsersContent() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })
    .order('name', { ascending: true })

  const { data: departments } = await supabase
    .from('departments')
    .select('*')

  const users = (profiles ?? []) as Profile[]
  const depts = (departments ?? []) as Department[]
  const deptMap = Object.fromEntries(depts.map(d => [d.id, d.name]))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--mal-text-strong-950)]">Users</h1>
          <p className="text-sm text-[var(--mal-text-sub-600)] mt-0.5">{users.length} members in the organisation</p>
        </div>
        <Link href="/admin/users/invite"
          className="inline-flex items-center gap-1.5 rounded-mal-8 bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white text-sm font-medium px-3 py-1.5 transition-colors">
          <UserPlus className="h-4 w-4" />
          Invite User
        </Link>
      </div>

      <div className="rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] overflow-hidden shadow-mal-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-weak-50)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide">Role</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide hidden sm:table-cell">Department</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--mal-stroke-soft-200)]">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-[var(--mal-bg-weak-50)] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[var(--mal-alpha-purple-10)] border border-[var(--mal-alpha-purple-24)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-[var(--mal-purple-600)]">
                        {u.name[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--mal-text-strong-950)]">{u.name}</p>
                      <p className="text-xs text-[var(--mal-text-soft-400)]">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${ROLE_COLORS[u.role]}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-[var(--mal-text-sub-600)]">
                  {u.department_id ? deptMap[u.department_id] ?? '—' : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <Circle className={`h-2 w-2 fill-current ${u.is_active ? 'text-green-500' : 'text-[var(--mal-text-soft-400)]'}`} />
                    <span className="text-xs text-[var(--mal-text-sub-600)]">
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <UsersContent />
    </RoleGuard>
  )
}
