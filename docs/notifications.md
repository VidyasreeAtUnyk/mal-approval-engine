# Notifications — Mal Approval Engine

## Overview

Two delivery channels:
1. In-app realtime (Supabase Realtime) — built now
2. Email (Supabase Edge Functions) — noted as next step

---

## Trigger Map

| Event | Who gets notified | Type |
|---|---|---|
| Request submitted | Approver | request_pending_review |
| Request approved | Requester | request_approved |
| Request rejected | Requester | request_rejected |
| Request pending >24h | Approver reminder | request_pending_review |

---

## Creating Notifications

```typescript
// lib/notifications.ts

export type NotificationType =
  | 'request_submitted'
  | 'request_approved'
  | 'request_rejected'
  | 'request_pending_review'

export async function createNotification(
  userId: string,
  requestId: string,
  type: NotificationType,
  title: string,
  message: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      request_id: requestId,
      type,
      title,
      message
    })

  if (error) {
    // Log but don't throw — notifications are
    // non-critical, don't block the main flow
    console.error('Notification failed:', error)
  }
}
```

---

## Notification Messages

```typescript
export function buildNotification(
  type: NotificationType,
  requesterName: string,
  flowLabel: string,
  approverNote?: string
): { title: string; message: string } {
  switch (type) {
    case 'request_pending_review':
      return {
        title: `New ${flowLabel}`,
        message: `${requesterName} submitted 
          a ${flowLabel.toLowerCase()} 
          awaiting your review.`
      }
    case 'request_approved':
      return {
        title: `${flowLabel} Approved`,
        message: approverNote
          ? `Your request was approved. 
             Note: ${approverNote}`
          : `Your ${flowLabel.toLowerCase()} 
             has been approved.`
      }
    case 'request_rejected':
      return {
        title: `${flowLabel} Rejected`,
        message: approverNote
          ? `Your request was rejected. 
             Reason: ${approverNote}`
          : `Your ${flowLabel.toLowerCase()} 
             was not approved.`
      }
  }
}
```

---

## Realtime Subscription

```typescript
// hooks/useNotifications.ts

export function useNotifications(userId: string) {
  const [notifications, setNotifications] =
    useState<Notification[]>([])
  const [unreadCount, setUnreadCount] =
    useState(0)

  useEffect(() => {
    // Initial fetch
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Add to list
          setNotifications(prev =>
            [payload.new as Notification, ...prev]
          )
          // Increment counter
          setUnreadCount(prev => prev + 1)
          // Show toast
          toast(payload.new.title, {
            description: payload.new.message
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)

    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId
          ? { ...n, read_at: new Date().toISOString() }
          : n
      )
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return { notifications, unreadCount, markAsRead }
}
```

---

## UI — Notification Bell

```typescript
// components/layout/NotificationBell.tsx

export function NotificationBell() {
  const { profile } = useProfile()
  const { notifications, unreadCount, markAsRead } =
    useNotifications(profile.id)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon"
          className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1
              flex h-5 w-5 items-center justify-center
              rounded-full bg-[var(--mal-purple-500)]
              text-xs text-white font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <NotificationList
          notifications={notifications}
          onMarkAsRead={markAsRead}
        />
      </PopoverContent>
    </Popover>
  )
}
```

---

## Where Notifications Are Created

In API routes, after status changes:

```typescript
// app/api/requests/[id]/approve/route.ts

// After updating request status:
await createNotification(
  request.requester_id,
  request.id,
  'request_approved',
  ...buildNotification(
    'request_approved',
    requesterProfile.name,
    flowConfig.label,
    approverNote
  ),
  supabase
)

// Also log the audit entry
await logStatusChange(
  request.id,
  user.id,
  'pending',
  'approved',
  approverNote,
  supabase
)
```

---

## Email Notifications (Next Step)

Not built in prototype — mentioned in presentation.

Would use Supabase Edge Functions:
1. Trigger on notification INSERT
2. Read user email from profiles
3. Send via Resend or Supabase SMTP

```typescript
// supabase/functions/send-notification-email/
// index.ts (edge function)

Deno.serve(async (req) => {
  const { record } = await req.json()
  // Send email for record.user_id
  // with record.title and record.message
})
```
