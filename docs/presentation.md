# Presentation — Mal Approval Engine

## Format
Live demo + walkthrough
Target: 7-9 minutes total

---

## 1. The Brief (15 seconds)

"Build a small web app. One request → review → decision flow.
Two users. 72 hours."

Simple brief. I had a different question.

---

## 2. The Real Question (30 seconds)

"What does a company actually need?"

Not one flow. Many flows.
Not two users. A real org hierarchy.
Not a demo. Something that could ship.

So I built the engine once —
and made every flow a config file.

```
budget-request/config.ts   ← 2 days ago
leave-request/config.ts    ← 2 days ago
access-request/config.ts   ← tomorrow, if needed
vendor-payment/config.ts   ← next week, if needed
```

One platform. Every new flow is two files and one registry line.
No engine changes. No schema migrations.

---

## 3. Product Decisions Before Code (1 minute)

"Before touching Claude Code, I made four decisions.
Each one is in docs/decisions/ with context, alternatives rejected,
and consequences."

### Why three roles, not two
The brief said requester and approver.
But a manager submitting a request also needs an approver.
A two-role system can't model that — you hack it later.
Three roles: employee → manager → admin.
Routing is automatic. Department visibility is built in.

### Why one table with JSONB, not one table per flow
Separate tables = schema migration for every new flow.
EAV tables = complex, hard to query.
JSONB + Zod: flexible at the DB layer, type-safe at the app layer.
New flow, zero DB changes.

### Why drafts go to Supabase, not localStorage
localStorage is device-specific.
URL params expose financial data in browser history.
DB drafts work across devices, survive tab crashes,
and the same idempotency key promotes them to pending on submit.
No orphan rows.

### Why invite-only, not self-registration
This is an internal tool. Open registration is a security hole.
Admin invites by email and assigns a role.
That's how internal platforms actually work.

---

## 4. Live Demo (3 minutes)

### Scene 1 — Employee submits a budget request
Login as employee@test.com
- New Budget Request → fill form → show inline validation
- "Help me write" → AI drafts the justification inline
- Submit → AI summary generated, flags appear
- Type something, wait 2 seconds — watch "Draft saved" appear
- Close the tab, reopen — form restores exactly where you left off

### Scene 2 — Manager approves in realtime
Open new window → login as manager@test.com
- Notification bell shows 1 unread — no refresh
- Click notification → goes directly to the request
- Read AI summary, review flags
- AI flags any concerns — e.g. team overlap on leave, missing justification on budget
- Add approval note → Approve
- Switch back to employee window — notification appears live
- Status badge on request detail flips to Approved — no reload

### Scene 3 — Admin sees everything
Open new window → login as admin@test.com
- Org-wide dashboard — all departments, all flows
- Filter by dept, flow type, status, date range — spinner shows while loading
- Click into a request → audit trail shows every status change with timestamp
- User management → show invite flow (email + role)

### Scene 4 — New flow in two files
"This is the reusability moment."
- Open src/flows/leave-request/config.ts — fields, AI context, one file
- Open src/flows/leave-request/schema.ts — Zod schema
- Show flow-registry.ts — one line added
- Leave request: calendar picker, overlap detection, AI summary
- "The engine handled everything else."

---

## 5. The Playbook (30 seconds)

"Your JD says: in the first 60 days, document your prototyping
workflow — prompts, decisions, gotchas — for the team.

I did that while building."

Show docs/prompts.md:
- Every phase logged: what was built, why, what broke, what was learned
- 8 phases documented
- This file is the team's shared playbook from day one

Show docs/decisions/:
- Four architecture decisions, written before any code
- Context, consequences, alternatives rejected

GitHub: https://github.com/VidyasreeAtUnyk/mal-approval-engine

"This isn't a post-mortem. It was written in real time."

---

## 6. What I Built vs What I Faked vs What I Skipped (30 seconds)

**Built for real:**
- RLS on every table — no exceptions
- Audit trail on every status change
- Idempotency on every submission — draft key promotes to pending on submit, no orphan rows
- Realtime across three user sessions
- 101 tests across 11 suites
- Auth middleware — unauthenticated direct URL access redirects to login
- Fully responsive — sidebar drawer, mobile-first layouts, no overflow at 375px
- Lighthouse: 100 Accessibility · 100 Best Practices · 100 SEO · 81 Performance
- Zero hydration errors — dark mode theme toggle deferred until after mount
- No CLS in header — fixed-width skeleton holds layout while profile loads
- Wide-screen safe — sidebar and content share a max-width container, stay centred at any viewport
- Input validation at both layers — `min={0}` on number inputs + Zod `.positive()` server-side

**Explicitly skipped with a reason:**
- Email notifications → noted, Supabase edge function pattern documented
- Full org chart → three roles covers the real use case
- Per-flow DB tables → JSONB + Zod is the right call for a prototype
- LCP below 2.5s → Suspense streaming identified, deferred; current 4.2s is DB latency

"Most prototypes fake the security layer and call it MVP.
This one has RLS, a service client pattern, an audit log,
auth middleware, and a 100 accessibility score
because at Mal, a prototype sometimes ships."

---

## 7. Timeline (15 seconds)

"The brief gave 72 hours.

This took under 48.

Two flows. Three roles. Realtime. AI. 101 tests. Deployed.
Full docs. Architecture decisions written before code.
Responsive. Auth middleware. 100 Accessibility. 100 SEO.

The remaining time is for Suspense streaming, bundle analysis,
and whatever the team wants to test next."

---

## 8. What's Next (30 seconds)

If this ships:
- Arabic RTL — already built in a previous project
- Email notifications — Supabase edge function, one trigger
- access-request and vendor-payment flows — two files each
- Bulk approval for admins
- LCP below 2.5s — stream page shell with Suspense so header + filters paint while DB query runs
- Remove 56 KiB unused JS — audit shadcn/radix-ui imports with next build bundle analyser
- Eliminate render-blocking CSS (120ms) — inline critical CSS for above-the-fold content

If this is a prototype:
- Hand the engine to the team
- docs/prompts.md becomes the starting point for the shared playbook
- Any engineer can add a flow from the docs alone

---

## 9. The Meta Point (30 seconds)

"You said you need someone who turns a hypothesis into
a deployed, usable product in days — not weeks.

You said the prototype is the thing, and sometimes it ships.

You said in the first 60 days, document your workflow
for the team.

I approached this the way I'd work if I were already on the team.

The build log is written, the decisions are documented,
the engine is reusable by anyone who reads the docs.

I wanted this to feel like something a teammate handed over —
not a portfolio piece.

That's the kind of contributor I want to be at Mal."

---

## Visuals Checklist

Screenshots to take before presenting:
- [ ] Employee dashboard (empty state)
- [ ] Budget request form with AI assist active
- [ ] "Draft saved" indicator on form
- [ ] AI summary card on submitted request
- [ ] Manager notification bell with unread badge
- [ ] Manager approval view with AI summary + flags
- [ ] Employee request page — status flips live (screen record)
- [ ] Admin dashboard with filters active + spinner
- [ ] Leave request with calendar date picker
- [ ] docs/prompts.md scrolled to show depth
- [ ] docs/decisions/ open
- [ ] Git commit history (meaningful messages, logical progression)
- [ ] Dark mode on any page

---

## Note on Team Practices

This is a solo project — no Cowork board, no PR review process.
In a team at Mal, every task would be tracked on the Cowork board
and all changes would go through PR review.
The commit discipline and docs structure here reflect how I'd work
in that context from day one.

---

## Submission Package

- [x] Live URL — https://mal-approval-engine.vercel.app/
- [x] GitHub repo — https://github.com/VidyasreeAtUnyk/mal-approval-engine
- [x] Test accounts (3 roles — employee, manager, admin / Test1234!)
- [x] README with local setup instructions
- [ ] This presentation (PDF export)
