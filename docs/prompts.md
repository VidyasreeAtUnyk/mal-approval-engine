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
- `src/app/api/ai/summarize/route.ts` — fetches request, calls claude-sonnet-4-6, parses JSON response, stores ai_summary + ai_flags, returns fallback on any error
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
