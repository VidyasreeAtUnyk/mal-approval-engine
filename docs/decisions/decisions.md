# ADR-001: Split CLAUDE.md into focused doc files

## Status
Accepted

## Context
Initial CLAUDE.md was ~300 lines covering everything.
Too long for Claude Code to scan efficiently per task.

## Decision
CLAUDE.md is now a navigation file (~80 lines).
Each topic has its own doc in docs/.
Claude Code reads only the relevant doc per task.

## Consequences
- Faster, more focused prompts
- Easier to update individual topics
- Mirrors real engineering org documentation
- New team member can onboard doc by doc

## Alternatives Considered
Single long CLAUDE.md — rejected (too much noise per task)
Wiki/Notion — rejected (not co-located with code)

---

# ADR-002: Config-Driven Flow Architecture

## Status
Accepted

## Context
The brief asks for one approval flow.
But real companies have many flows.
Building one-off is wasteful.

## Decision
Build a config-driven engine.
Each flow is a single config.ts + schema.ts file.
The engine reads any FlowConfig and renders it.
Adding a new flow = one config file + one registry line.

## Consequences
- New flows take minutes not hours
- Engine tested once, works for all flows
- Reusability is demonstrable live in the presentation
- Slightly more upfront architecture work

## Alternatives Considered
Hardcoded single flow — rejected (not reusable)
Database-driven flow config — rejected (overkill for prototype)

---

# ADR-003: JSONB for Form Data

## Status
Accepted

## Context
Different flows have different form fields.
Could create separate tables per flow type.
Could create an EAV (entity-attribute-value) table.
Could use JSONB.

## Decision
Single requests table with form_data as JSONB.

## Consequences
- No schema migration needed for new flows
- All requests queryable from one table
- Flow-specific queries use JSONB operators
- Slightly less type-safe at DB level (mitigated by Zod)

## Alternatives Considered
Separate table per flow — rejected (schema changes per flow)
EAV table — rejected (complex, hard to query)

---

# ADR-004: Draft Persistence via Supabase

## Status
Accepted

## Context
Users filling long forms may leave and return.
Browser storage (localStorage) is device-specific.
Session storage is lost on tab close.

## Decision
Save wizard state to Supabase as status='draft'.
Auto-save on each step completion.
Fetch existing draft on mount.
Draft → pending on final submission.

## Consequences
- Works across devices and browsers
- Requires auth before starting (user must be logged in)
- Approvers never see drafts (RLS + status filter)
- Slightly more Supabase calls during form fill

## Alternatives Considered
localStorage — rejected (device-specific)
URL params — rejected (sensitive financial data in URL)
No persistence — rejected (poor UX for long forms)

---

# ADR-005: In-App Notifications via Supabase Realtime

## Status
Accepted

## Context
Approvers need to know when requests arrive.
Requesters need to know when decisions are made.
Could use email only.
Could use polling.
Could use websockets.
Supabase provides Realtime out of the box.

## Decision
In-app notifications via Supabase Realtime (postgres_changes).
Email notifications noted as next step (edge functions).

## Consequences
- Zero additional infrastructure
- Realtime updates without polling
- Email not implemented (noted in presentation)
- Requires active browser session to receive

## Alternatives Considered
Email only — rejected (not realtime)
Polling — rejected (unnecessary load)
Custom websockets — rejected (overkill, Supabase handles it)

---

# ADR-006: Three-Role Hierarchy (employee/manager/admin)

## Status
Accepted

## Context
Brief asks for two user types: requester and approver.
Real orgs have more complex hierarchies.
Could model as simple requester/approver.
Could model as full org chart.

## Decision
Three roles: employee, manager, admin.
manager_id on profiles drives approval routing.
Department-scoped visibility for managers.
Admin sees everything.

## Consequences
- Realistic org model
- Multi-department support built in
- More complex RLS policies
- Better demo story (3 windows test)

## Alternatives Considered
Two roles (requester/approver) — rejected (too simple)
Full org chart with levels — rejected (overkill for prototype)
