# CLAUDE.md — Mal Approval Engine

Read this first. Everything else is in docs/.

---

## What We're Building

Config-driven, multi-flow internal approval engine
for Mal. One platform. Many flows. Each new flow
is a single config file.

Current: budget-request
Planned: leave-request, access-request, vendor-payment

**Before any task, read the relevant doc.**

---

## Quick Reference

| Topic | File |
|---|---|
| Architecture + structure | docs/architecture.md |
| Database schema + RLS | docs/database.md |
| Adding a new flow | docs/flows.md |
| Security rules | docs/security.md |
| Testing strategy | docs/testing.md |
| Git conventions | docs/git.md |
| Verification checklist | docs/verification.md |
| Notifications | docs/notifications.md |
| Build log | docs/prompts.md |
| Presentation | docs/presentation.md |

---

## Stack

- Next.js 14 · TypeScript strict · Tailwind + shadcn/ui
- Supabase (Postgres + Auth + Realtime)
- OpenAI API (gpt-4o-mini)
- Vercel

---

## Design Tokens — FROM MAL'S ACTUAL CODEBASE

```css
--mal-bg-white-0        /* primary white */
--mal-bg-weak-50        /* subtle gray */
--mal-bg-soft-200       /* medium gray */
--mal-bg-strong-950     /* near black */
--mal-text-strong-950   /* primary text */
--mal-text-sub-600      /* secondary text */
--mal-text-soft-400     /* muted text */
--mal-text-white-0      /* white text */
--mal-purple-500        /* primary brand */
--mal-purple-600        /* hover */
--mal-alpha-purple-8    /* very subtle bg */
--mal-alpha-purple-10   /* subtle bg */
--mal-alpha-purple-24   /* border/ring */
--mal-stroke-soft-200   /* default border */
shadow-mal-xs
shadow-mal-fancy-neutral
shadow-mal-fancy-stroke
rounded-mal-8
rounded-mal-10
```

Dark mode via `dark:` variants.
Never use hardcoded hex values.

---

## Roles

```
admin
  └── manager (approves employee requests)
        └── employee (submits requests)
```

Routing:
- employee → their manager_id
- manager → admin
- admin → self-approved

---

## Test Accounts

```
employee@test.com / Test1234!
  role: employee, dept: Engineering

manager@test.com / Test1234!
  role: manager, dept: Engineering

admin@test.com / Test1234!
  role: admin
```

---

## Non-Negotiables

- RLS on every table — no exceptions
- Server-side auth on every API route
- Role read from DB — never from client
- Zod validation before any DB write
- OPENAI_API_KEY server-only (never NEXT_PUBLIC_)
- Tests pass before every commit
- Append to docs/prompts.md after each task
- Show git diff before committing — wait for approval
- Mobile-first: every new component must work on 375px viewport — no fixed widths that overflow, use CSS grid not flex-wrap for multi-item rows, use fixed+translate for dropdowns near viewport edges

---

## Build Status

- [x] CLAUDE.md + docs/ written
- [x] Git repo initialized
- [x] Supabase project created
- [x] Schema + RLS applied via MCP
- [x] Auth + 3 test accounts created
- [x] Budget request flow config
- [x] Engine components built
- [x] Claude AI summary working
- [x] Notifications (realtime)
- [x] Draft persistence
- [x] Leave request flow (reusability demo)
- [x] Calendar conflict detection
- [x] Admin dashboard
- [x] Tests passing (99 tests, 11 suites)
- [x] Deployed on Vercel — https://mal-approval-engine.vercel.app/
- [x] docs/prompts.md complete
- [x] docs/presentation.md complete
- [x] Responsive — sidebar drawer, mobile skeletons, filter grid, notification centering
- [x] Cowork board — N/A (solo project; noted in presentation)
