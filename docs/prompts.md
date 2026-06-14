# Build Log — Mal Approval Engine

This file is auto-maintained by Claude Code.
Append after every significant task. Never delete.

Format:
## [Task] — [Date]
### Prompt
### Built
### Decisions
### Gotchas
### Next

---

## Project Setup — [Date: TBD]

### Prompt
Initial project setup with CLAUDE.md and docs structure.

### Built
- CLAUDE.md (navigation file)
- docs/architecture.md
- docs/database.md
- docs/flows.md
- docs/security.md
- docs/testing.md
- docs/git.md
- docs/verification.md
- docs/notifications.md
- docs/decisions/ (ADRs)
- docs/prompts.md (this file)
- docs/presentation.md

### Decisions
- Split CLAUDE.md into focused doc files
  (see ADR-001)
- Designed all schemas before writing code
- Chose config-driven architecture for reusability
  (see ADR-002)

### Gotchas
None yet — pre-code setup phase.

### Next
- Create Next.js project
- Connect Supabase MCP
- Apply schema and RLS

---

## Phase 0 — Project Initialization — 2026-06-13

### Prompt
Bootstrap Next.js 14 project in the existing repo directory, install all dependencies, configure Jest, shadcn/ui, and Mal design tokens.

### Built
- Next.js 14.2.35 scaffolded (via temp dir merge — `create-next-app` requires empty dir)
- All runtime deps: `@supabase/supabase-js`, `@supabase/ssr`, `@anthropic-ai/sdk`, `zod`, `react-hook-form`, `@hookform/resolvers`, `sonner`, `lucide-react`, `date-fns`, `react-day-picker`
- Dev deps: `jest`, `ts-jest`, `@types/jest`, `jest-environment-jsdom`
- shadcn/ui initialized + components: button, input, textarea, select, label, badge, card, popover, dialog, skeleton, tabs, separator
- `jest.config.ts` with `@/` alias mapping
- `package.json` test scripts added (`test`, `test:watch`, `test:coverage`)
- `tailwind.config.ts` extended with all Mal design tokens (shadows, border radii, font)
- `globals.css` rewritten: Mal CSS custom properties (light + dark), shadcn HSL tokens, no hardcoded hex in utility classes
- `src/app/layout.tsx` updated: Inter font (Geist not available in Next 14), correct metadata
- `.gitignore` updated to exclude `claude_desktop_config.json`

### Decisions
- Used Inter font instead of Geist — Geist is not available as a Google Font in Next.js 14.2.x
- Replaced shadcn v4 modern CSS imports (`@import "tw-animate-css"`, `@import "shadcn/tailwind.css"`) with standard Tailwind v3 directives — Next.js 14 uses Tailwind v3
- Defined all Mal design tokens as CSS custom properties in `globals.css`; Tailwind extended config maps semantic tokens (border, ring, primary) to HSL CSS vars

### Gotchas
- `create-next-app@14` refuses to run in a directory with any existing files — worked around by scaffolding in `mal-next-tmp` sibling dir and copying with PowerShell
- shadcn v4 init generates CSS that uses `border-border` utility, which requires the `border` color to be registered in `tailwind.config.ts` — fixed by extending Tailwind colors
- Duplicate `borderRadius` keys in tailwind config caused TypeScript compile error — merged into a single object

### Next
- Phase 1: Apply Supabase schema + RLS via MCP

---

## Phase 1 — Supabase Schema + RLS — 2026-06-13

### Prompt
Apply all tables from docs/database.md via MCP in FK-dependency order. Enable RLS immediately after each table. Apply all policies. Seed departments and profiles using provided Auth UUIDs.

### Built
- `departments` — created, RLS on, `departments_read_all` + `admins_manage_departments` policies
- `profiles` — created, RLS on, `profiles_own` + `managers_see_team` + `admins_all_profiles` policies; FK to `auth.users`, self-referential `manager_id`
- `departments.head_id` FK to `profiles` added in second migration (circular dep resolved by deferring)
- `requests` — created, RLS on, 4 policies: employee-own, manager-team-select, manager-team-update, admin-all
- `request_audit_log` — created, RLS on, 2 policies: own-request-select, admin-all
- `notifications` — created, RLS on, `own_notifications` policy
- `invites` — created, RLS on, `admins_manage_invites` policy
- 10 indexes on requests, notifications, profiles
- `update_updated_at()` trigger on `requests`
- 3 departments seeded: Engineering, Finance, Operations
- 3 profiles seeded: admin → manager → employee (Engineering dept, correct manager_id chain)

### Decisions
- `departments` admin policy deferred to a second migration because it references `profiles` which didn't exist yet; `head_id` FK also added in same second migration
- Seed inserted admin first (no FK deps), then manager (refs admin), then employee (refs manager) — order matters due to `manager_id` FK

### Gotchas
- Employee UUID provided in prompt was truncated by one char (`540f07f9faf` = 11 chars). Looked up real UUID from `auth.users`: `f56a81ea-c742-483f-99ce-540f07f9fafb`
- `create-next-app` issue from Phase 0 (carried forward for reference): any existing files in dir cause refusal

### Next
- Phase 2: Scaffold folder structure + write types
- Phase 3: Core library layer (supabase clients, anthropic, flow registry, schemas, router, audit, notifications)

---

## Phase 2+3 — Types, Lib Layer, Flow Configs, Tests — 2026-06-13

### Prompt
Scaffold all types, core lib files, flow configs + schemas, and all unit tests. Run npm test + npm run build before committing.

### Built
**Types**
- `src/types/profile.types.ts` — `Role`, `Profile`, `Department`
- `src/types/flow.types.ts` — `FieldType`, `FlowField`, `FlowConfig`, `Request`, `RequestStatus`, `AuditEntry`, `Notification`, `NotificationType`

**Lib**
- `src/lib/supabase.ts` — browser client via `createBrowserClient`
- `src/lib/supabase-server.ts` — SSR server client + service role client via `createServerClient` from `@supabase/ssr`
- `src/lib/anthropic.ts` — singleton `Anthropic` instance, server-only
- `src/lib/flow-registry.ts` — `FLOW_REGISTRY` array + `getFlow(id)` helper
- `src/lib/approval-router.ts` — `getApprover()`: employee→manager, manager→admin, admin→self, with no_manager + not_found edge cases
- `src/lib/audit.ts` — `logStatusChange()`: inserts to `request_audit_log`, never throws
- `src/lib/notifications.ts` — `createNotification()` + `buildNotification()`: non-throwing, covers all 4 notification types

**Flow configs**
- `src/flows/budget-request/config.ts` — 6 fields, aiAssistEnabled, aiPromptContext
- `src/flows/budget-request/schema.ts` — Zod v4 schema with `as const` enums
- `src/flows/leave-request/config.ts` — 4 fields, daterange type
- `src/flows/leave-request/schema.ts` — date_range refinement (from ≤ to)

**Tests — 55 passing across 6 suites**
- `src/__tests__/approval-router.test.ts` — 4 cases
- `src/__tests__/audit.test.ts` — 5 cases
- `src/__tests__/notifications.test.ts` — 9 cases
- `src/lib/flow-registry.test.ts` — 8 cases
- `src/flows/budget-request/schema.test.ts` — 14 cases
- `src/flows/leave-request/schema.test.ts` — 9 cases

### Decisions
- Used `createBrowserClient` / `createServerClient` from `@supabase/ssr` (not the legacy helpers) for Next.js 14 App Router compatibility
- `createServiceClient()` exported separately for API routes that need to bypass RLS
- `approval-router` reads role from DB on every call — never trusts any client-passed role

### Gotchas
- **Zod v4 breaking changes**: `required_error` / `invalid_type_error` options removed from `z.number()` and `z.enum()`. Fixed: removed constructor options; use `{ error: '...' }` for enum params and rely on `.positive()` for number validation
- **ESLint unused vars**: two leftover variables in test files (`makeMockSupabase`, `insertCall`) blocked `npm run build` — removed
- Zod v4 `z.enum()` requires `as const` tuple, not a plain `string[]`

### Next
- Phase 4: Auth (middleware, login page, useProfile hook, RoleGuard)
- Phase 5: Engine components (Header, Sidebar, StatusBadge, AIInsight, ApprovalForm, CalendarField, RequestCard, ApproverView)

---

## Phase 4+5 — Auth + Engine Components — 2026-06-13

### Prompt
Build the full auth layer and all engine components. npm test + npm run build must pass.

### Built
**Auth (Phase 4)**
- `middleware.ts` — session refresh via `@supabase/ssr`, redirects unauthenticated users to `/login`, passes through `/login`, `/invite`, `/_next`, `/api/auth`
- `src/app/(auth)/layout.tsx` — centered card layout for auth pages
- `src/app/(auth)/login/page.tsx` — email/password login, role-based redirect after sign-in (employee→/dashboard, manager→/manager/dashboard, admin→/admin/dashboard)
- `src/hooks/useProfile.ts` — client-side hook, fetches profile from `profiles` table, returns `{ profile, loading }`
- `src/components/layout/RoleGuard.tsx` — wraps pages, redirects wrong roles to `/dashboard`, shows skeleton while loading
- `src/app/providers.tsx` — `ThemeProvider` wrapper (next-themes, class mode)
- `src/app/layout.tsx` — updated: Providers + Toaster, `suppressHydrationWarning` on `<html>`
- `src/app/page.tsx` — server-side root redirect based on role

**Engine (Phase 5)**
- `src/engine/StatusBadge.tsx` — draft/pending/approved/rejected with Mal tokens, no hardcoded hex
- `src/engine/AIInsight.tsx` — summary + flags display with Sparkles icon, skeleton loading state
- `src/engine/RequestCard.tsx` — request summary card with flow label, primary value, amount, status badge, relative time, AI flag indicator
- `src/engine/CalendarField.tsx` — react-day-picker v10 range picker, Mal token class names
- `src/engine/ApprovalForm.tsx` — config-driven: handles all 7 field types, react-hook-form Controller, AI assist button on aiAssist textarea fields, idempotency key ref
- `src/engine/ApproverView.tsx` — full request detail: form data grid, AI insight, approve/reject with note validation, audit log timeline
- `src/components/layout/Header.tsx` — logo, dark mode toggle, user avatar + name + role, sign-out
- `src/components/layout/Sidebar.tsx` — role-filtered nav (new request flows, my requests, approvals, admin links)
- `src/app/(app)/layout.tsx` — authenticated shell: Header + Sidebar + main content

**Deps added**: `next-themes`

### Decisions
- `ApprovalForm` uses react-hook-form `Controller` with dynamic field rendering — no per-flow form component needed
- Root `page.tsx` is a server component doing the role redirect — avoids client-side flash
- Notification bell in `Header` is a portal placeholder (`div#notification-bell-portal`) — replaced in Phase 8
- `useProfile` is a client hook intentionally — server-reads happen in API routes and page.tsx; the hook serves interactive components

### Gotchas
- `react/no-unescaped-entities` ESLint rule blocked build for `"entry.note"` in JSX — fixed with `&ldquo;`/`&rdquo;`
- `next-themes` requires `suppressHydrationWarning` on `<html>` to avoid SSR mismatch

### Next
- Phase 6: API routes (POST /api/requests, approve, reject, ai/summarize, ai/assist)
- Phase 7: Pages (employee dashboard, new request, manager dashboard, admin dashboard, user management)

---

## Phase 6 — API Routes — 2026-06-13

### Prompt
Build all API routes following the security pattern from docs/security.md. Every route: session check → role from DB → input validation → action. Add anthropic.test.ts.

### Built
- `src/lib/schema-registry.ts` — maps flow_type → Zod schema for server-side validation
- `src/app/api/requests/route.ts` — POST (submit/draft) + GET (list own requests). Upsert with idempotency_key, getApprover(), audit log, notification, fire-and-forget AI summarize
- `src/app/api/requests/[id]/approve/route.ts` — POST: manager/admin only, approver_id check, status→approved, audit + notify requester
- `src/app/api/requests/[id]/reject/route.ts` — POST: note required, status→rejected, audit + notify requester
- `src/app/api/ai/summarize/route.ts` — fetches request, calls gpt-5.4-mini, parses JSON response, stores ai_summary + ai_flags, returns fallback on any error
- `src/app/api/ai/assist/route.ts` — takes fieldId + filled formData, calls Claude to draft textarea content, returns { text }
- `src/__tests__/anthropic.test.ts` — 5 tests mocking @/lib/anthropic: success, API throw, malformed JSON, empty content, context inclusion

### Decisions
- AI summarize is fire-and-forget from POST /api/requests — doesn't block the 201 response. Uses internal fetch with session cookie forwarding
- Approve/reject both verify `approver_id = auth.uid()` at query level — RLS + explicit check = double protection
- Schema validation only runs when status==='pending', not on draft saves
- `schema-registry.ts` keeps flow-specific schemas server-side only, not imported in client bundle

### Gotchas
- `jest.mock('@anthropic-ai/sdk')` with dynamic `import()` inside test function doesn't receive the mock — fixed by mocking `@/lib/anthropic` singleton instead
- `response.content[0]?.type === 'text'` type narrowing needed for TypeScript to allow `.text` access on the union type

### Next
- Phase 7: All pages (employee dashboard, new request page, request detail, manager dashboard, admin dashboard, user management)

---

## Phase 7 — Pages, Hardening, Draft Persistence, Tests — 2026-06-14

### Prompt
Build all app pages. Fix bugs found during manual verification. Add draft persistence, withdraw, and admin approval. Harden for production: error boundaries, not-found page, scalable flow UI, extracted business logic, and full test coverage for route-handler logic.

### Built
**Pages**
- `src/app/(app)/dashboard/page.tsx` — employee: own requests list, empty state, `NewRequestMenu` for flow selection
- `src/app/(app)/[flowType]/new/page.tsx` — new request form: draft restore on mount, debounced auto-save, idempotency key, better validation error toasts
- `src/app/(app)/[flowType]/[id]/page.tsx` — request detail: field display (daterange formatted), `WithdrawButton` for pending/draft
- `src/app/(app)/manager/dashboard/page.tsx` — manager: pending requests routed to them, sorted by created_at
- `src/app/(app)/manager/request/[id]/page.tsx` — manager approval view (ApproverView)
- `src/app/(app)/admin/dashboard/page.tsx` — admin: org-wide requests, filters (dept/flow/status/date), stats cards, department lookup
- `src/app/(app)/admin/request/[id]/page.tsx` — admin approval view (ApproverView)
- `src/app/(app)/admin/users/page.tsx` — user list with role badges
- `src/app/(app)/admin/users/invite/page.tsx` — invite form (email + role)
- `src/app/(app)/error.tsx` — app-level error boundary (client component, AlertCircle + "Try again")
- `src/app/(app)/not-found.tsx` — 404 page with "Back to dashboard" link

**New components + lib**
- `src/engine/WithdrawButton.tsx` — two-step confirm, soft-deletes pending/draft requests, triggers router.push + router.refresh
- `src/components/layout/NewRequestMenu.tsx` — ≤2 flows: individual buttons; >2 flows: dropdown with outside-click close
- `src/lib/request-permissions.ts` — pure functions: `requiresApproverFilter`, `canWithdraw`, `canReview`
- `src/lib/format.ts` — `formatDateRange`: formats daterange objects as "Jun 13 → Jun 20", no raw ISO strings
- `src/lib/openai.ts` — singleton OpenAI client (gpt-5.4-mini)

**API changes**
- `src/app/api/requests/[id]/approve/route.ts` — admin bypass: conditionally skips approver_id filter using `requiresApproverFilter(role)`
- `src/app/api/requests/[id]/reject/route.ts` — same admin bypass pattern
- `src/app/api/requests/[id]/withdraw/route.ts` — NEW: soft-delete via `deleted_at`; auth check via SSR client, write via service client (RLS blocks requester from writing deleted_at directly)
- `src/app/api/ai/summarize/route.ts` — team leave overlap detection and ai_flags write both use service client for cross-profile queries
- `src/app/api/ai/assist/route.ts` — model: gpt-5.4-mini, max_tokens: 300
- `src/app/api/invites/route.ts` — POST invite with role validation

**Draft persistence**
- `ApprovalForm` watches all fields, debounces 1.5s, calls `onDraftSave` with idempotency key
- `[flowType]/new/page.tsx` loads existing draft on mount, reuses same idempotency key so saves upsert the same row
- Same key on final submit promotes draft to pending — no orphan rows
- "Saving draft…" / "Draft saved" indicator shown inline

**Sidebar + flow UI scaling**
- Sidebar: shows first 3 flows, "N more" toggle for additional flows
- NewRequestMenu: compact dropdown at >2 flows for dashboard header
- Both patterns scale to any number of flows without UI bloat

**Tests — 99 passing across 11 suites**
- `src/__tests__/request-permissions.test.ts` — 7 cases for all 3 exported functions
- `src/__tests__/date-format.test.ts` — 6 cases (multi-day, same-day, partial, non-daterange, null, no raw ISO)
- `src/__tests__/schema-alignment.test.ts` — verifies each flow's schema accepts minimum form-valid input (catches client/server min-length mismatches)
- `src/__tests__/anthropic.test.ts` — rewritten: calls real route handler with mocked dependencies; asserts model=gpt-5.4-mini and AED currency in prompt
- `src/flows/budget-request/schema.test.ts` — updated: justification empty fails, any non-empty passes
- `src/flows/leave-request/schema.test.ts` — updated: reason empty fails, single char passes

### Decisions
- **service client pattern**: `createServiceClient()` MUST use plain `createClient` from `@supabase/supabase-js` (not `@supabase/ssr`) — SSR wrapper does NOT bypass RLS even with service role key. Applied to: overlap detection, ai_flags write, withdraw deleted_at write.
- **Business logic extraction**: route handler rules (who can approve, who can withdraw, who can review) moved to `src/lib/request-permissions.ts` — now independently testable without HTTP layer
- **Admin approve bypass**: conditional `approver_id` filter rather than a separate admin code path — less code, same security
- **Draft idempotency**: same `idempotency_key` reused for all draft saves and the final submit. Upsert on that key means one row per form session, no orphan drafts.
- **Schema alignment**: lowered `justification` and `reason` from `min(10)` to `min(1)` to match HTML `required` validation — `min(10)` caused silent 422s on short but valid input

### Gotchas
- **Admin 500 on approve**: `.eq('approver_id', user.id)` applied unconditionally — admins have no approver_id on others' requests. Fixed by `requiresApproverFilter(role)`.
- **Withdraw 500**: RLS blocks the requester from updating `deleted_at` column even on their own row. Must use service client with belt-and-suspenders `.eq('requester_id', user.id)`.
- **Dashboard stale cache after withdraw**: `router.push('/dashboard')` serves Next.js cached RSC. Fixed by adding `router.refresh()` after push.
- **Team leave overlap silent failure**: `createServerClient()` (SSR, session-scoped) can't read other users' profiles due to RLS. Switched all overlap + flags-write queries to service client.
- **Jest `Request is not defined`**: route handlers import `next/server` which needs the Web `Request` global. jsdom doesn't have it. Fixed with `/** @jest-environment node */` directive.
- **`[...new Set(...)]` build error**: TypeScript downlevelIteration required for Set spread. Fixed with manual dedup filter instead.
- **AI currency showed `$`**: prompt didn't specify currency. Added "Always use AED" as first line of system prompt; test now asserts it.

### Next
- Phase 8: Realtime notifications (bell, unread count, mark-read)

---

## Phase 8 — Realtime Notifications — 2026-06-14

### Prompt
Build notification bell with live updates. Bell shows unread count badge, dropdown lists recent notifications with type-coloured dots and timestamps. Clicking a notification navigates to the correct page based on role and notification type. Opening the bell marks all as read. Request detail page updates live when status changes.

### Built
- `src/app/api/notifications/route.ts` — GET: list own notifications, joined with `requests(flow_type)`, limit 100, newest first
- `src/app/api/notifications/read/route.ts` — PATCH: bulk mark all unread as read
- `src/hooks/useNotifications.ts` — fetches on mount, Supabase Realtime subscription filtered by `user_id=eq.{userId}`, `markAllRead` with optimistic update
- `src/components/layout/NotificationBell.tsx` — bell + badge (9+ cap), scrollable dropdown (max-h-96), role-aware navigation, auto mark-all-read on open, empty state
- `src/engine/RequestStatusWatcher.tsx` — zero-render client component, subscribes to `UPDATE` on specific request row, calls `router.refresh()` on change so server component re-renders live
- Header: replaced `div#notification-bell-portal` placeholder with `<NotificationBell />`

**DB migrations applied:**
- `enable_notifications_realtime_and_fix_rls` — added `notifications` to `supabase_realtime` publication; split blanket ALL policy into SELECT + UPDATE (own rows) + INSERT (open, service role only)
- `enable_requests_realtime` — added `requests` to `supabase_realtime` publication for `RequestStatusWatcher`

**Bug fixes discovered and fixed during verification:**
- `createNotification` used session-scoped client → RLS blocked inserting for another user. Fixed: service client
- `getApprover` manager→admin lookup used session client → manager's RLS can't read admin profile. Fixed: service client for that query only
- Realtime channel had no `filter` → events never matched. Fixed: `filter: \`user_id=eq.${userId}\``
- Notification click hardcoded `/dashboard`. Fixed: role + type → correct URL
- `supabase_realtime` had zero tables — Realtime was completely non-functional. Fixed via migration

**Tests — 101 passing (2 new):**
- `approval-router.test.ts` rewritten: mocks `createServiceClient`, adds manager→admin and manager→no-admin cases
- `notifications.test.ts` rewritten: mocks `createServiceClient` instead of accepting client param

### Decisions
- `createNotification` owns its own service client — callers never pass a supabase arg. Simpler API, impossible to accidentally use wrong client.
- Realtime fires a refetch rather than patching state from the payload — simpler, always consistent with DB, no edge cases from partial payloads.
- Bell auto-marks-all-read on open (not per-item) — matches standard notification UX (Slack, Linear, etc.)
- `RequestStatusWatcher` renders null — purely a side-effect component, no UI, no layout impact

### Gotchas
- `own_notifications` RLS was `FOR ALL` with `qual = user_id = auth.uid()` — this applies to INSERT too, blocking server-side cross-user notification creation. Must split into separate SELECT/UPDATE/INSERT policies.
- `supabase_realtime` publication starts empty in new projects — must explicitly `ALTER PUBLICATION supabase_realtime ADD TABLE <name>` for each table you want broadcast.
- `createBrowserClient` from `@supabase/ssr` supports Realtime but requires user session to be established before subscribing — hence the `getUser()` call in the hook before setting up the channel.
- Approval router's manager→admin lookup was RLS-blocked silently — `getApprover` returned `no_manager` and no notification was created. Only caught by manual testing.

### Next
- Phase 13: Vercel deployment
- Phase 14: docs/presentation.md completion
- Phase 9: Draft persistence polish (conflict resolution if same user has draft on two devices)
- Phase 13: Vercel deployment
- Phase 14: docs/prompts.md + docs/presentation.md completion
