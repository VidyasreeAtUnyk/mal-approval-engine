# Notifications — Mal Approval Engine

## Overview

Two delivery channels:
1. In-app realtime (Supabase Realtime) — built in Phase 8
2. Email (Supabase Edge Functions) — future phase

---

## Trigger Map

| Event | Who gets notified | Type |
|---|---|---|
| Employee submits request | Their manager | request_pending_review |
| Manager submits request | Admin | request_pending_review |
| Request approved | Requester | request_approved |
| Request rejected | Requester | request_rejected |

---

## Key Design Decisions

**Service client for inserts** — `createNotification` uses `createServiceClient()`, not the session-scoped client. The `own_notifications` RLS policy restricts inserts to `user_id = auth.uid()`, which means a route acting as employee can't insert a notification for the manager. Service role bypasses this.

**Approval router uses service client for admin lookup** — `getApprover()` uses the session client for the requester's own profile (always readable), but switches to service client when looking up the admin profile for manager→admin routing. Managers can't read other profiles under RLS.

**Realtime filter is required** — The channel subscription includes `filter: \`user_id=eq.${userId}\`` to scope events to the logged-in user. Without it, Supabase sends all table events and drops them silently at the RLS layer — the subscription appears to work but never fires.

---

## Creating Notifications

```typescript
// lib/notifications.ts — uses service client internally
await createNotification(
  userId,       // recipient
  requestId,
  'request_approved',
  title,
  message
)
```

Never pass a supabase client — the function creates its own service client.

---

## Realtime Subscription

```typescript
// hooks/useNotifications.ts

const channel = supabase
  .channel(`notifications:${userId}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,   // required
  }, () => {
    fetchNotifications()              // refetch on any change
  })
  .subscribe()
```

The hook also subscribes to `requests` table updates via `RequestStatusWatcher` on the detail page — when a request is approved, the status badge and audit log update live without page reload.

---

## Tables in supabase_realtime Publication

Both added via migration:
- `notifications` — for the bell
- `requests` — for `RequestStatusWatcher` on detail page

---

## RLS Policies on notifications

| Policy | Operation | Rule |
|---|---|---|
| notifications_select | SELECT | `user_id = auth.uid()` |
| notifications_update | UPDATE | `user_id = auth.uid()` |
| notifications_insert | INSERT | `WITH CHECK (true)` — server only via service role |

---

## Navigation from Bell

The bell uses notification `type` + viewer `role` to build the correct link:

| Type | Role | Navigates to |
|---|---|---|
| request_pending_review | manager | /manager/request/{id} |
| request_pending_review | admin | /admin/request/{id} |
| request_approved / rejected | employee | /{flow_type}/{id} |

`flow_type` is fetched via join: `select('*, requests(flow_type)')`.

---

## Email Notifications (Future)

Would use Supabase Edge Functions triggered on notification INSERT:
1. Read user email from profiles
2. Send via Resend or Supabase SMTP
