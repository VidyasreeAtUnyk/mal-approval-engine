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

---

## Phase 9 — Responsive + Polish — 2026-06-15

### Prompt
Make the app fully responsive. Sidebar collapses on mobile to a hamburger-triggered Sheet drawer. Admin filter bar stacks without overlap. Notification dropdown centers on small screens. All pages get loading skeletons. Favicon and OG meta tags added. Brand mark updated from "M" to Arabic "مال" across all touchpoints.

### Built
- `src/components/layout/Sidebar.tsx` — refactored into `SidebarContent` (shared) + desktop aside (`hidden md:flex w-56`) + mobile Sheet drawer triggered by fixed hamburger button. Links close the drawer on tap.
- `src/components/layout/Header.tsx` — `pl-8 md:pl-0` on logo to clear mobile hamburger. Profile name `hidden sm:block`.
- `src/app/(app)/layout.tsx` — `p-3 md:p-6` + `min-w-0` on main to prevent flex overflow.
- `src/components/admin/FilterBar.tsx` — `grid grid-cols-2 sm:flex` container; selects `w-full sm:flex-none sm:w-{n}`. Spinner spans both columns on mobile.
- `src/components/layout/NotificationBell.tsx` — dropdown: `fixed left-1/2 -translate-x-1/2 top-14` on mobile, `absolute right-0 top-10` on sm+. Width: `min(320px, calc(100vw-2rem))`.
- Admin stat grid: `grid-cols-2 sm:grid-cols-4` (page + loading skeleton).
- `src/components/ui/sheet.tsx` — added via `npx shadcn@latest add sheet`.
- **Loading skeletons added for all server-rendered pages:**
  - `(app)/dashboard/loading.tsx`
  - `(app)/manager/dashboard/loading.tsx`
  - `(app)/[flowType]/[id]/loading.tsx`
  - `(app)/[flowType]/new/loading.tsx`
  - `(app)/manager/request/[id]/loading.tsx`
  - `(app)/admin/request/[id]/loading.tsx`
  - `(app)/admin/users/loading.tsx`
- `src/app/icon.svg` — Arabic "مال" in white on purple circle; Next.js 14 auto-serves as favicon.
- `src/app/opengraph-image.tsx` — 1200×630 OG card via `next/og` ImageResponse. Dark gradient, purple grid, logo mark, feature pills.
- `src/app/layout.tsx` — full OG metadata (metadataBase, openGraph, twitter card).
- Login, invite, header logo marks: `M` → `مال` with `rounded-full`.

### Decisions
- Sidebar uses Sheet (slide-in drawer) not bottom nav — internal tools are navigation-heavy; bottom nav would be too cramped.
- Hamburger button is `fixed` (not inside Header JSX) to avoid coupling Sidebar state to Header component.
- FilterBar switches to CSS grid on mobile (not flex-wrap) — grid guarantees no overlap; flex-wrap with flex-1 on 4 items collapses unpredictably.
- Notification dropdown uses `fixed` centering on mobile — `absolute right-0` overflows left on small viewports when the panel is wide.
- Loading skeletons match page layout shapes (header, cards, list rows) — avoids jarring layout shift when data arrives.
- Per-route error.tsx not added — app-level `(app)/error.tsx` covers all routes; `notFound()` handles 404 cases directly.

### Gotchas
- `flex-1` on 4 selects in `flex-wrap` causes them to share rows unpredictably on mobile — 2-column CSS grid is the correct fix.
- `absolute right-0` for dropdowns positioned near the right edge of a narrow viewport causes the dropdown to bleed off the left side — use `fixed + translate` for centering on mobile.
- Sheet component must be installed via shadcn CLI (`npx shadcn@latest add sheet`) — not bundled by default.
- Next.js `loading.tsx` at the `admin/` layout level fires for all admin sub-routes — scope to `admin/dashboard/` specifically if other admin pages have different shapes.

### Next
- Performance + SEO polish (Lighthouse audit)
- Arabic RTL support
- access-request and vendor-payment flows

---

## Phase 10 — Performance, Accessibility & Auth Guard — 2026-06-15

### Prompt
Improve Lighthouse scores on the admin dashboard page. Address LCP (4.6s), TBT (620ms), accessibility failures (button names, contrast), and add auth middleware so unauthenticated direct URL access redirects to login.

### Built
- `src/middleware.ts` — Next.js middleware that runs before every non-static, non-API route. Calls `supabase.auth.getUser()` and redirects to `/login` if no session. Fixes blank screen on direct URL access to protected routes.
- `src/context/ProfileContext.tsx` — React context + `ProfileProvider` that fetches profile once per page load. Replaces 4 independent `useProfile()` calls (Sidebar, Header, NotificationBell, RoleGuard) with a single shared fetch.
- `src/hooks/useProfile.ts` — now re-exports from `ProfileContext`; all existing imports unchanged.
- `src/app/(app)/layout.tsx` — wraps app shell with `ProfileProvider`.
- `src/lib/get-user.ts` — `React.cache` wrapper around `supabase.auth.getUser()` to deduplicate calls within a single server render pass.
- `src/app/(app)/admin/dashboard/page.tsx` — removed `RoleGuard` (was hiding server-rendered content behind client skeleton); role check now inline in server component. DB-level filtering for `flow`, `status`, `date` params; only `dept` filter stays in JS (join field).
- `src/engine/ApprovalForm.tsx` — `CalendarField` now loaded via `next/dynamic` with `ssr: false`. Removes `react-day-picker` from the initial JS bundle; only loaded when a date-range field is present.
- `src/app/(auth)/login/page.tsx` — split into server component (card shell) + `LoginForm.tsx` (client island). Card renders in first HTML response; only the form inputs need JS hydration.
- `src/app/(auth)/login/LoginForm.tsx` — client island with state, handlers, and error display.
- `src/app/layout.tsx` — `display: swap` + `preload: true` on Inter font; `<link rel="preconnect">` + `dns-prefetch` for Supabase URL.
- `src/app/globals.css` — `--mal-text-soft-400` darkened `#9e9e9e` → `#767676` (WCAG AA 4.5:1 contrast ratio on white).
- `src/components/admin/FilterBar.tsx` — `aria-label` added to all 4 Select triggers.
- `src/components/layout/NewRequestMenu.tsx` — dropdown button: `aria-label`, `aria-expanded`, `aria-haspopup="menu"`, `role="menu"` + `role="menuitem"` on items.
- `mal-approval-engine-presentation.docx` — regenerated with 6 screenshots in 2-column grid.
- `src/flows/access-request/` — access-request flow config + schema (planned flow, wired into registry).

### Decisions
- `RoleGuard` removed from admin dashboard — middleware + server-side role check makes it redundant. Keeping it was the primary cause of LCP 4.6s (it hid server content behind a client-side loading skeleton).
- Profile context over SWR/React Query — the app has 4 client components that need profile; a single context is simpler and sufficient.
- `React.cache` not used in pages yet (would require threading `getUser` result down) — `ProfileContext` covers the client-side deduplication which matters more for TBT.
- `react-day-picker` dynamic import with `ssr: false` — the calendar is never needed on initial render; excluding it cuts the shared bundle by ~40KB.
- Login page server/client split — the Card, logo, title, and description are static; only the form fields need client JS. This gives the browser something to paint immediately on slow connections.

### Gotchas
- `RoleGuard` wrapping a server component in a client component means the server-rendered content is hidden behind the client skeleton — the HTML exists in the page source but the user doesn't see it until JS runs and profile loads.
- `React.cache` is per-request (not global) — safe to use for auth data; does not leak across users.
- `next/dynamic` with `ssr: false` means the calendar field shows a pulse skeleton on first render — acceptable for a form field that appears below the fold.
- Middleware must exclude `/api/*` routes — they handle auth internally via `createServerClient`.

### Next
- Lighthouse re-audit after deploy (target: LCP <2.5s, TBT <200ms, Accessibility 95+)
- Arabic RTL support
- access-request and vendor-payment flows
- Bulk approval for admins

### Lighthouse results after Phase 10
- Performance: 68 → 81
- Accessibility: 89 → 100
- Best Practices: 100
- SEO: 100
- TBT: 620ms → 230ms
- LCP: 4.6s → 4.2s (still above 2.5s target — Supabase fetch latency + render-blocking CSS)

### Remaining performance work (deferred)
- Suspense streaming on admin dashboard — shell paints at FCP (1.2s), data streams in; would drop LCP to ~1.2s
- Bundle analysis via `ANALYZE=true next build` — target the 56 KiB unused JS (shadcn/radix-ui)
- Inline critical CSS — eliminate 120ms render-blocking from Tailwind bundle

---

## Phase 11 — Security Hardening — 2026-06-15

### Prompt
Security audit covering XSS, CSRF, SQL injection, secrets exposure, auth bypass, and rate limiting. Add security headers and rate limit AI routes.

### Built
- `next.config.mjs` — security headers on all routes: `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy` (connect-src scoped to Supabase URL + OpenAI)
- `src/lib/rate-limit.ts` — in-memory rate limiter keyed by `route:userId`. Sliding window with configurable limit + windowMs. Returns `allowed`, `remaining`, `resetAt`. Swap Map for Upstash Redis when scaling.
- `src/app/api/ai/summarize/route.ts` — rate limited at 20 calls/user/minute, returns 429 with `Retry-After` + `X-RateLimit-Reset` headers
- `src/app/api/ai/assist/route.ts` — same rate limit applied

### Security posture after Phase 11

| Threat | Status |
|---|---|
| XSS | ✅ React escaping + CSP header |
| SQL injection | ✅ Supabase query builder only |
| CSRF | ✅ SameSite cookies via Supabase SSR |
| Clickjacking | ✅ X-Frame-Options: DENY |
| Auth bypass | ✅ Middleware + server-side role check + RLS |
| Secret exposure | ✅ No client-side secrets |
| MIME sniffing | ✅ X-Content-Type-Options: nosniff |
| AI route abuse | ✅ 20 req/user/min rate limit |

### Decisions
- Rate limit keyed by user ID not IP — authenticated internal tool; shared office IP would otherwise block all users
- In-memory store is sufficient for prototype — resets on restart, no cross-instance sharing on Vercel. Upstash Redis is a one-file swap when needed.
- `unsafe-inline` and `unsafe-eval` required in CSP — Next.js inlines scripts and Tailwind inlines styles; removing these breaks the app
- CSP `connect-src` scoped to `NEXT_PUBLIC_SUPABASE_URL` + OpenAI — blocks unexpected outbound connections from client JS

### Gotchas
- CSP `connect-src` must include `wss:` for Supabase Realtime websocket connections — omitting it silently breaks live notifications
- `frame-ancestors 'none'` in CSP is redundant with `X-Frame-Options: DENY` but belt-and-suspenders; older browsers respect XFO, modern ones respect CSP
- Rate limit store is module-level — persists across requests within the same serverless instance but not across cold starts

### Next
- Swap rate limit store for Upstash Redis for cross-instance consistency
- Add `Strict-Transport-Security` header (HSTS) — Vercel handles this at the edge but worth adding explicitly
- CSP reporting endpoint for production monitoring

---

## Phase 12 — Bug fixes: wide-screen layout, negative amount, draft-overwrite race — 2026-06-15

### Prompt
Fix sidebar drifting from content on wide screens (4000px), money field accepting negative numbers, and submitted requests staying as "draft" in dashboard.

### Built
- `src/app/(app)/layout.tsx` — wrapped sidebar+main in `max-w-screen-xl mx-auto` so they stay centered together at wide viewports; moved `bg-[var(--mal-bg-weak-50)]` to outer div so background still fills full width
- `src/components/layout/Header.tsx` — wrapped header inner content in matching `max-w-screen-xl mx-auto` div so logo and actions align with the sidebar at all widths
- `src/engine/ApprovalForm.tsx` — added `min={0}` to number inputs; browser now prevents negative values at the HTML level (Zod `.positive()` remains as server-side backup)
- `src/engine/ApprovalForm.tsx` — clear both draft save timers (`saveTimer`, `savedTimer`) inside `onFormSubmit` before calling `onSubmit`; prevents the 1.5s debounced draft save from firing after submit and overwriting `status: 'pending'` back to `'draft'`

### Decisions
- `max-w-screen-xl` (1280px) chosen as the cap — wide enough for the admin filter bar, consistent with most internal tool conventions
- Draft timer cancellation placed in `onFormSubmit` (inside the form, before the parent's `handleSubmit`) so it fires regardless of what the parent does
- `min={0}` on all `type="number"` fields generically, not just amount — future number fields will inherit the same protection

### Next
- Add `min` to flow config field definition so flows can specify their own min/max per field
