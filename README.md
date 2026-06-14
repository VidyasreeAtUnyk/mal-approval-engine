# Mal Approval Engine

Config-driven, multi-flow internal approval engine. One platform, many flows — each new approval flow is a single config file.

Built as a working prototype for Mal's internal tooling stack.

---

## What It Does

Employees submit requests (budget, leave, etc.) through a structured form. Requests route to the right approver automatically based on role. Approvers review, add notes, and approve or reject. Everyone gets live notifications — no refresh needed.

- **Employee** submits → routed to their manager
- **Manager** submits → routed to admin
- **Admin** sees everything org-wide

---

## Stack

- Next.js 14 · TypeScript strict · Tailwind + shadcn/ui
- Supabase (Postgres + RLS + Realtime + Auth)
- OpenAI `gpt-5.4-mini` for AI summaries and inline assist
- Vercel

---

## Features

- Config-driven engine — new flow = one config file, zero engine changes
- Role-based routing and access (employee → manager → admin)
- AI summary generated on every submission, flags potential issues
- AI inline assist on textarea fields ("Help me write")
- Draft auto-save with restore on re-open
- Realtime notifications — bell updates live without page refresh
- Request detail page updates live when status changes
- Withdraw pending/draft requests (soft delete)
- Admin org-wide dashboard with filters (dept, flow, status, date)
- Audit log on every status change
- Dark mode
- 101 unit tests across 11 suites

---

## Flows

| Flow | Status |
|---|---|
| Budget Request | Live |
| Leave Request | Live |
| Access Request | Planned |
| Vendor Payment | Planned |

---

## Local Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd mal-approval-engine
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

`OPENAI_API_KEY` is server-only — never prefix with `NEXT_PUBLIC_`.

### 3. Run

```bash
npm run dev
```

---

## Test Accounts

| Email | Password | Role |
|---|---|---|
| employee@test.com | Test1234! | Employee · Engineering |
| manager@test.com | Test1234! | Manager · Engineering |
| admin@test.com | Test1234! | Admin |

---

## Tests

```bash
npm test
npm run test:coverage
```

101 tests · 11 suites · covering schemas, routing logic, AI routes, notifications, permissions, date formatting, and schema/form alignment.

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (app)/
│   │   ├── dashboard/        # Employee dashboard
│   │   ├── [flowType]/new/   # New request form (any flow)
│   │   ├── [flowType]/[id]/  # Request detail
│   │   ├── manager/          # Manager dashboard + approval view
│   │   └── admin/            # Admin dashboard + user management
│   └── api/
│       ├── requests/         # Submit, list, approve, reject, withdraw
│       ├── ai/               # Summarize, assist
│       └── notifications/    # List, mark read
├── engine/                   # Config-driven UI components
├── flows/                    # Per-flow config + schema
├── lib/                      # Supabase clients, router, audit, notifications
└── hooks/                    # useProfile, useNotifications
```

---

## Architecture

Every approval flow is defined in two files:

```
src/flows/<flow-id>/
├── config.ts   # Fields, labels, AI context
└── schema.ts   # Zod validation schema
```

The engine reads the config and renders the form, routes the request, runs the AI summary, and handles all notifications — without any flow-specific code.

---

## Security

- RLS on every table — no exceptions
- Server-side auth on every API route
- Role read from DB — never from client
- Zod validation before every DB write
- Service role key server-only, never exposed to client
- Soft delete (deleted_at) — data never permanently removed by users

---

## Docs

| Topic | File |
|---|---|
| Architecture | docs/architecture.md |
| Database schema + RLS | docs/database.md |
| Adding a new flow | docs/flows.md |
| Security rules | docs/security.md |
| Notifications | docs/notifications.md |
| Build log | docs/prompts.md |
