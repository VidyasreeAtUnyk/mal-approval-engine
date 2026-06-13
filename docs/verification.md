# Verification — Mal Approval Engine

## How to Verify

Three levels after each feature:

1. `npm test` — automated
2. `npm run build` — TypeScript clean
3. Manual checklist below

---

## The 3-Window Test

Most important manual test.
Open 3 browser windows or profiles simultaneously:

```
Window 1: employee@test.com
Window 2: manager@test.com
Window 3: admin@test.com
```

1. Employee submits request in Window 1
2. Notification appears in Window 2 (realtime — no refresh)
3. Manager approves in Window 2
4. Notification appears in Window 1 (realtime)
5. Admin in Window 3 sees everything throughout

This single test validates:
auth, routing, realtime, notifications, RLS — all at once.

---

## Auth

- [ ] Employee can log in
- [ ] Manager can log in
- [ ] Admin can log in
- [ ] Wrong password shows error message
- [ ] Logged out user redirected to /login
- [ ] Session persists on page refresh
- [ ] Invite link creates account with correct role
- [ ] Expired invite link shows error

---

## Submit Request (Employee)

- [ ] Form renders all budget-request fields
- [ ] Required field validation shows inline
- [ ] Validation shows on change not just submit
- [ ] Draft saves automatically on each step
- [ ] Page refresh → draft restored, form pre-filled
- [ ] Submit → status changes to pending
- [ ] Claude AI summary visible on submission
- [ ] Manager receives notification (realtime)
- [ ] Submitting same form twice is blocked (idempotency)
- [ ] Employee cannot see other employees' requests

---

## Approve/Reject (Manager)

- [ ] Manager sees only their team's requests
- [ ] Manager cannot see other department requests
- [ ] Manager cannot see their own submitted requests
  in the approval queue
- [ ] Approve → status changes to approved
- [ ] Reject → requires a note (validation)
- [ ] Requester receives notification on approval
- [ ] Requester receives notification on rejection
- [ ] Audit log entry created for both actions
- [ ] Manager can see AI summary on each request

---

## Manager Submits Request

- [ ] Manager can submit budget request
- [ ] Their request routes to admin (not another manager)
- [ ] Admin receives notification
- [ ] Admin can approve/reject

---

## Admin Dashboard

- [ ] Admin sees ALL requests across all departments
- [ ] Admin sees all flow types
- [ ] Admin can approve manager requests
- [ ] Admin sees org-wide stats
- [ ] Admin can access user management

---

## User Management (Admin)

- [ ] Admin can invite new user by email
- [ ] Invite includes role, department, manager
- [ ] Invited user receives email
- [ ] User accepts invite, sets password
- [ ] Profile created with correct role/dept/manager
- [ ] Admin can change user role
- [ ] Admin can change user department
- [ ] Admin can deactivate user
- [ ] Deactivated user cannot log in

---

## Notifications

- [ ] Bell icon shows unread count
- [ ] Count updates in realtime (no page refresh)
- [ ] Clicking bell opens notification list
- [ ] Clicking notification navigates to request
- [ ] Notification marked as read on click
- [ ] Read notifications don't increment counter

---

## Dark Mode

- [ ] Toggle button in header works
- [ ] Preference persists on page refresh
- [ ] All components look correct in dark mode
- [ ] No white flash on dark mode load

---

## Reusability Demo

- [ ] `/new-flow leave-request` slash command works
- [ ] Leave request config file created
- [ ] Flow registered in registry
- [ ] Leave request form renders correctly
- [ ] Calendar shows for daterange fields
- [ ] Calendar shows team conflicts
- [ ] Full leave request approval flow completes

---

## Security

- [ ] Employee cannot access /manager/* routes
- [ ] Employee cannot access /admin/* routes
- [ ] Manager cannot access /admin/* routes
- [ ] Direct URL access blocked by RoleGuard
- [ ] API returns 401 without valid session
- [ ] API returns 403 for wrong role
- [ ] Employee cannot read other employees'
  requests via direct API call

### RLS Verification (Supabase SQL editor)

```sql
-- Test as employee user (use Supabase RLS checker)
-- Should only return their own requests
SELECT * FROM requests;

-- Attempt to update another user's request
-- Should return 0 rows
UPDATE requests
SET status = 'approved'
WHERE requester_id != auth.uid();
```

---

## Performance

- [ ] Page load under 2s on slow 4G
- [ ] Form submission feels instant
- [ ] Realtime notifications appear within 1s
- [ ] No blank screens — skeletons show while loading

---

## Live URL Verification

After Vercel deployment, repeat key tests
on the live URL (not just localhost):

- [ ] Login works
- [ ] Submit request works
- [ ] Approval flow works
- [ ] Realtime notifications work
- [ ] Dark mode persists
- [ ] All 3 test accounts work

---

## Final Checklist Before Submission

- [ ] Live URL accessible
- [ ] All 3 test accounts work on live URL
- [ ] `npm test` passes
- [ ] `npm run build` clean
- [ ] docs/prompts.md has full build log
- [ ] docs/presentation.md complete
- [ ] Git history clean and meaningful
- [ ] GitHub repo public
- [ ] README has live URL and test accounts
- [ ] Cowork board shows completed tasks
