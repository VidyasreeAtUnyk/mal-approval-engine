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
