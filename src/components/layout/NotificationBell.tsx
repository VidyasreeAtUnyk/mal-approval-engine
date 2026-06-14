'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Inbox } from 'lucide-react'
import { useNotifications, NotificationWithFlow } from '@/hooks/useNotifications'
import { useProfile } from '@/hooks/useProfile'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

const TYPE_COLORS: Record<string, string> = {
  request_approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  request_rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  request_pending_review: 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)]',
  request_submitted: 'bg-[var(--mal-bg-weak-50)] text-[var(--mal-text-sub-600)]',
}

function NotificationItem({ n, role }: { n: NotificationWithFlow; role?: string }) {
  const dotColor = TYPE_COLORS[n.type] ?? TYPE_COLORS.request_submitted
  const flowType = n.requests?.flow_type

  let href = '/dashboard'
  if (n.type === 'request_pending_review') {
    href = role === 'admin' ? `/admin/request/${n.request_id}` : `/manager/request/${n.request_id}`
  } else if (flowType) {
    href = `/${flowType}/${n.request_id}`
  }

  return (
    <Link
      href={href}
      className={cn(
        'flex gap-3 px-4 py-3 hover:bg-[var(--mal-bg-weak-50)] transition-colors',
        !n.read_at && 'bg-[var(--mal-alpha-purple-8)]'
      )}
    >
      <span className={cn('h-2 w-2 rounded-full shrink-0 mt-1.5', dotColor.split(' ')[0])} />
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-medium text-[var(--mal-text-strong-950)] leading-snug', !n.read_at && 'font-semibold')}>
          {n.title}
        </p>
        <p className="text-xs text-[var(--mal-text-sub-600)] mt-0.5 leading-snug line-clamp-2">{n.message}</p>
        <p className="text-xs text-[var(--mal-text-soft-400)] mt-1">
          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
        </p>
      </div>
    </Link>
  )
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const { profile } = useProfile()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  function handleOpen() {
    const opening = !open
    setOpen(opening)
    if (opening && unreadCount > 0) {
      markAllRead()
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        className="relative h-8 w-8 flex items-center justify-center rounded-mal-8 text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)] transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[var(--mal-purple-500)] text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-80 rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] shadow-mal-fancy-stroke z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--mal-stroke-soft-200)]">
            <span className="text-sm font-semibold text-[var(--mal-text-strong-950)]">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs text-[var(--mal-text-soft-400)]">{unreadCount} unread</span>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-[var(--mal-stroke-soft-200)]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-[var(--mal-text-soft-400)]">
                <Inbox className="h-8 w-8" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => <NotificationItem key={n.id} n={n} role={profile?.role} />)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
