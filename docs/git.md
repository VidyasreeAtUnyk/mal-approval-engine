# Git — Mal Approval Engine

## Commit Format

```
type(scope): message
```

### Types

| Type | When |
|---|---|
| feat | New feature |
| fix | Bug fix |
| chore | Setup, config, deps |
| docs | Documentation only |
| test | Tests only |
| refactor | Code change, no behavior change |
| style | Formatting only |

### Scopes

```
engine      — ApprovalForm, RequestCard, engine components
flows       — flow configs and schemas
auth        — login, invite, session
supabase    — schema, RLS, migrations
ai          — Claude summary, AI assist
notifications — notification system
admin       — admin dashboard, user management
(employee)  — employee routes
(manager)   — manager routes
docs        — documentation files
```

### Examples

```bash
git commit -m "chore: initialize Next.js project"
git commit -m "chore(supabase): apply schema and RLS"
git commit -m "feat(engine): add config-driven form renderer"
git commit -m "feat(flows): add budget-request config"
git commit -m "feat(ai): add Claude summary on submission"
git commit -m "feat(auth): add invite-based onboarding"
git commit -m "feat(notifications): add realtime bell"
git commit -m "feat(flows): add leave-request with calendar"
git commit -m "feat(admin): add user management panel"
git commit -m "test: add approval-router unit tests"
git commit -m "docs: add architecture decision records"
git commit -m "fix(engine): handle missing manager gracefully"
```

---

## Workflow

After each task Claude Code will:

1. Run `npm test` — must pass
2. Run `npm run build` — must compile
3. Show `git diff --stat`
4. Suggest commit message
5. Wait for your approval
6. Commit and append to docs/prompts.md

**Never commit if tests fail.**

---

## Never Commit

```
.env
.env.local
.env.development.local
node_modules/
.next/
.vercel/
```

These are in .gitignore already.

---

## Branch Strategy

For this assessment: work directly on main.
Single developer, 72 hour window.

Production would use:
```
main          ← production
develop       ← integration
feature/*     ← feature branches
```

---

## Target Commit History

```
chore: initialize Next.js project with TypeScript
chore: add CLAUDE.md and docs structure
chore(supabase): apply schema and RLS policies
chore(supabase): seed test accounts
feat(auth): add login and session management
feat(auth): add invite flow for new users
feat(flows): add budget-request flow config
feat(engine): add config-driven form renderer
feat(engine): add approval routing logic
feat(ai): add Claude summary on submission
feat(ai): add AI assist on textarea fields
feat(notifications): add realtime notification bell
feat(engine): add draft persistence per flow
feat(flows): add leave-request with calendar
feat(admin): add org-wide dashboard
feat(admin): add user management panel
test: add unit tests for critical business logic
docs: add architecture decision records
chore: deploy to Vercel
```

Clean, logical, tells the story of the build.
