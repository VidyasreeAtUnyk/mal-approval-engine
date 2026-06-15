'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProfile } from '@/hooks/useProfile'
import { FLOW_REGISTRY } from '@/lib/flow-registry'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  PlusCircle,
  ChevronDown,
  Menu,
} from 'lucide-react'

const FLOW_VISIBLE_LIMIT = 3

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  const { profile } = useProfile()
  const [flowsExpanded, setFlowsExpanded] = useState(false)

  if (!profile) return null

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const visibleFlows = flowsExpanded
    ? FLOW_REGISTRY
    : FLOW_REGISTRY.slice(0, FLOW_VISIBLE_LIMIT)
  const hiddenCount = FLOW_REGISTRY.length - FLOW_VISIBLE_LIMIT

  const linkClass = (href: string) =>
    cn(
      'flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm transition-colors',
      isActive(href)
        ? 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] font-medium'
        : 'text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]'
    )

  return (
    <div className="flex flex-col gap-1 p-3">
      {/* New Request (employee + manager) */}
      {(profile.role === 'employee' || profile.role === 'manager') && (
        <div className="mb-2">
          <p className="text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide px-2 mb-1">
            New Request
          </p>
          {visibleFlows.map((flow) => (
            <Link
              key={flow.id}
              href={`/${flow.id}/new`}
              onClick={onNavigate}
              className={linkClass(`/${flow.id}/new`)}
            >
              <PlusCircle className="h-4 w-4 shrink-0" />
              {flow.label}
            </Link>
          ))}
          {hiddenCount > 0 && (
            <button
              onClick={() => setFlowsExpanded(e => !e)}
              className="flex items-center gap-2 rounded-mal-8 px-2 py-1.5 text-sm text-[var(--mal-text-soft-400)] hover:text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)] transition-colors w-full text-left"
            >
              <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform duration-150', flowsExpanded && 'rotate-180')} />
              {flowsExpanded ? 'Show less' : `${hiddenCount} more`}
            </button>
          )}
        </div>
      )}

      {/* Employee / Manager dashboard */}
      {(profile.role === 'employee' || profile.role === 'manager') && (
        <Link href="/dashboard" onClick={onNavigate} className={linkClass('/dashboard')}>
          <LayoutDashboard className="h-4 w-4 shrink-0" />
          My Requests
        </Link>
      )}

      {/* Manager approvals */}
      {(profile.role === 'manager' || profile.role === 'admin') && (
        <Link href="/manager/dashboard" onClick={onNavigate} className={linkClass('/manager/dashboard')}>
          <CheckSquare className="h-4 w-4 shrink-0" />
          {profile.role === 'admin' ? 'My Approvals' : 'Approvals'}
        </Link>
      )}

      {/* Admin */}
      {profile.role === 'admin' && (
        <>
          <Link href="/admin/dashboard" onClick={onNavigate} className={linkClass('/admin/dashboard')}>
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            Admin Dashboard
          </Link>
          <Link href="/admin/users" onClick={onNavigate} className={linkClass('/admin/users')}>
            <Users className="h-4 w-4 shrink-0" />
            Users
          </Link>
        </>
      )}
    </div>
  )
}

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] min-h-screen flex-col">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger — rendered inside the Header via MobileSidebarTrigger */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="h-14 flex items-center px-4 border-b border-[var(--mal-stroke-soft-200)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--mal-purple-500)] flex items-center justify-center">
                <span className="text-white" style={{ fontSize: '9px', fontWeight: 700 }}>مال</span>
              </div>
              <span className="font-semibold text-sm text-[var(--mal-text-strong-950)]">Mal Approvals</span>
            </div>
          </div>
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Mobile trigger button — positioned in header via sibling export */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-4 z-40 h-8 w-8 flex items-center justify-center rounded-mal-8 text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)] transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-4 w-4" />
      </button>
    </>
  )
}
