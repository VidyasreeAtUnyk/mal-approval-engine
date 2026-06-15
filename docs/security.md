# Security — Mal Approval Engine

## Rules — No Exceptions

1. RLS on every table
2. Server-side auth on every API route
3. Role read from DB — never from client
4. Zod validation before any DB write
5. Sensitive keys never in NEXT_PUBLIC_
6. Security headers on every route (next.config.mjs)
7. Rate limit all AI routes — 20 req/user/min

---

## API Route Pattern

Every API route must start with this exact pattern:

```typescript
import { createServerClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  // 1. Get session
  const supabase = createServerClient()
  const { data: { user }, error: authError } =
    await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED',
        message: 'Please log in' } },
      { status: 401 }
    )
  }

  // 2. Get role from DB — never trust client
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, department_id, manager_id')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED',
        message: 'Account not active' } },
      { status: 401 }
    )
  }

  // 3. Check role for this action
  if (profile.role === 'employee') {
    return NextResponse.json(
      { error: { code: 'FORBIDDEN',
        message: 'Insufficient permissions' } },
      { status: 403 }
    )
  }

  // 4. Validate input
  const body = await req.json()
  const result = schema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { error: { code: 'VALIDATION',
        message: 'Invalid input',
        details: result.error.issues } },
      { status: 422 }
    )
  }

  // 5. Do the thing
  // ...
}
```

---

## RLS Policies Summary

See docs/database.md for full SQL.

| Table | Employee | Manager | Admin |
|---|---|---|---|
| requests | own only | own dept | all |
| profiles | own only | own team | all |
| notifications | own only | own only | all |
| audit_log | own requests | own dept | all |
| departments | read only | read only | all |

---

## Environment Variables

```bash
# .env.local (never commit this file)

# Public — safe to expose
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Private — server only
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-ant-...
```

Never prefix with NEXT_PUBLIC_:
- SUPABASE_SERVICE_ROLE_KEY
- OPENAI_API_KEY

---

## Input Validation

Every form submission validated with Zod
before touching the database:

```typescript
// Never do this
await supabase.from('requests').insert({
  form_data: req.body  // ← dangerous
})

// Always do this
const result = BudgetRequestSchema.safeParse(body)
if (!result.success) {
  return error response
}
await supabase.from('requests').insert({
  form_data: result.data  // ← validated
})
```

---

## Idempotency

Prevent duplicate submissions on slow networks:

```typescript
// Client generates once per form session
const idempotencyKey = useRef(crypto.randomUUID())

// Server uses upsert with unique key
await supabase.from('requests').upsert(
  { ...data, idempotency_key: key },
  { onConflict: 'idempotency_key',
    ignoreDuplicates: true }
)
```

---

## Security Headers

Configured in `next.config.mjs`, applied to all routes:

| Header | Value | Protects against |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer leakage |
| `Permissions-Policy` | camera/mic/geo off | Unwanted API access |
| `Content-Security-Policy` | scoped to self + Supabase + OpenAI | XSS, injected scripts |

CSP `connect-src` must include `wss:` for Supabase Realtime. `unsafe-inline` and `unsafe-eval` are required by Next.js and Tailwind.

---

## Rate Limiting

AI routes are protected by `src/lib/rate-limit.ts`:

```typescript
// 20 calls per user per minute on both AI routes
const { allowed, resetAt } = rateLimit(`summarize:${user.id}`, {
  limit: 20,
  windowMs: 60_000,
})
if (!allowed) return NextResponse.json({ error: ... }, { status: 429 })
```

- Keyed by **user ID**, not IP — correct for an authenticated internal tool
- In-memory store — resets on restart, no cross-instance sharing
- Swap `Map` for Upstash Redis for production multi-instance deployments

---

## Auth Middleware

`src/middleware.ts` intercepts every non-static, non-API request. Redirects to `/login` if no valid session — prevents blank screen on direct URL access to protected routes.

---

## Route Protection

```typescript
// components/layout/RoleGuard.tsx
export function RoleGuard({
  allowedRoles,
  children
}: {
  allowedRoles: Role[]
  children: React.ReactNode
}) {
  const { profile } = useProfile()

  if (!profile) return <LoadingSpinner />

  if (!allowedRoles.includes(profile.role)) {
    redirect('/dashboard')
  }

  return <>{children}</>
}

// Usage in pages
export default function ManagerDashboard() {
  return (
    <RoleGuard allowedRoles={['manager', 'admin']}>
      {/* content */}
    </RoleGuard>
  )
}
```

---

## Error Response Format

All API errors follow this shape:

```typescript
interface ApiError {
  error: {
    code: ErrorCode
    message: string    // human readable
    field?: string     // if field-specific
    details?: unknown  // validation details
  }
}

type ErrorCode =
  | 'UNAUTHORIZED'   // 401 — not logged in
  | 'FORBIDDEN'      // 403 — wrong role
  | 'NOT_FOUND'      // 404 — resource missing
  | 'CONFLICT'       // 409 — duplicate
  | 'VALIDATION'     // 422 — invalid input
  | 'SERVER_ERROR'   // 500 — unexpected
```

---

## Compliance Notes

- Never hard delete requests (financial records)
- Never hard delete profiles (audit trail)
- Every status change logged in audit_log
- AI privacy notice shown when Claude assist used
- Sensitive JSONB fields should be encrypted
  in production (noted, not implemented in prototype)
