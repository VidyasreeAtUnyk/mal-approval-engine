'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { FLOW_REGISTRY } from '@/lib/flow-registry'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  PlusCircle,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const { profile } = useProfile()

  if (!profile) return null

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <aside className="w-56 shrink-0 border-r border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] min-h-screen p-3 flex flex-col gap-1">
      {/* New Request (employee + manager) */}
      {(profile.role === 'employee' || profile.role === 'manager') && (
        <div className="mb-2">
          <p className="text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide px-2 mb-1">
            New Request
          </p>
          {FLOW_REGISTRY.map((flow) => (
            <Link
              key={flow.id}
              href={`/${flow.id}/new`}
              className={cn(
                'flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm transition-colors',
                isActive(`/${flow.id}/new`)
                  ? 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] font-medium'
                  : 'text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]'
              )}
            >
              <PlusCircle className="h-4 w-4 shrink-0" />
              {flow.label}
            </Link>
          ))}
        </div>
      )}

      {/* Employee dashboard */}
      {(profile.role === 'employee' || profile.role === 'manager') && (
        <Link
          href="/dashboard"
          className={cn(
            'flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm transition-colors',
            isActive('/dashboard')
              ? 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] font-medium'
              : 'text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]'
          )}
        >
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          My Requests
        </Link>
      )}

      {/* Manager approvals */}
      {(profile.role === 'manager' || profile.role === 'admin') && (
        <Link
          href="/manager/dashboard"
          className={cn(
            'flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm transition-colors',
            isActive('/manager/dashboard')
              ? 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] font-medium'
              : 'text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]'
          )}
        >
          <CheckSquare className="h-4 w-4 shrink-0" />
          Approvals
        </Link>
      )}

      {/* Admin */}
      {profile.role === 'admin' && (
        <>
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm transition-colors',
              isActive('/admin/dashboard')
                ? 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] font-medium'
                : 'text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]'
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Admin Dashboard
          </Link>
          <Link
            href="/admin/users"
            className={cn(
              'flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm transition-colors',
              isActive('/admin/users')
                ? 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] font-medium'
                : 'text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]'
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
            Users
          </Link>
        </>
      )}
    </aside>
  )
}
