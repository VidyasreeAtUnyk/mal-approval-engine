# Testing — Mal Approval Engine

## Strategy

Strategic coverage of critical business logic.
Not exhaustive — purposeful.

The goal: if a bug would break the product,
there's a test for it.

---

## Test Stack

- Jest + ts-jest
- Mock Supabase client
- Mock Anthropic client

```bash
npm test              # run all tests
npm run test:watch    # watch mode
npm run test:coverage # coverage report
```

---

## Test Files

```
src/
  __tests__/
    approval-router.test.ts   ← routing logic
    audit.test.ts             ← audit logging
    notifications.test.ts     ← notification creation
    anthropic.test.ts         ← AI with mock
  flows/
    budget-request/
      schema.test.ts          ← zod validation
    leave-request/
      schema.test.ts
  lib/
    flow-registry.test.ts     ← config validation
```

---

## Mock Pattern

```typescript
// Mock Supabase client
jest.mock('@/lib/supabase-server', () => ({
  createServerClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: mockProfile,
      error: null
    }),
    insert: jest.fn().mockResolvedValue({
      data: null,
      error: null
    }),
    update: jest.fn().mockReturnThis(),
  })
}))

// Mock Anthropic
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: JSON.stringify({
            summary: 'Test summary',
            flags: []
          })
        }]
      })
    }
  }))
}))
```

---

## approval-router.test.ts

```typescript
describe('getApprover', () => {
  test('employee routes to their manager_id')
  test('manager routes to admin user')
  test('admin returns self')
  test('returns null if profile not found')
  test('returns null if manager not assigned')
  test('ignores inactive managers — find next admin')
})
```

---

## audit.test.ts

```typescript
describe('logStatusChange', () => {
  test('logs draft → pending correctly')
  test('logs pending → approved correctly')
  test('logs pending → rejected correctly')
  test('includes approver note when provided')
  test('handles DB error gracefully')
})
```

---

## notifications.test.ts

```typescript
describe('createNotification', () => {
  test('notifies approver when request submitted')
  test('notifies requester when approved')
  test('notifies requester when rejected')
  test('includes correct request_id')
  test('handles DB error without throwing')
})
```

---

## anthropic.test.ts

```typescript
describe('generateRequestSummary', () => {
  test('returns summary and flags on success')
  test('returns fallback when API fails')
  test('returns fallback when JSON malformed')
  test('returns fallback when content empty')
  test('includes flow context in prompt')
})
```

---

## flow-registry.test.ts

```typescript
describe('FLOW_REGISTRY', () => {
  test('contains budget-request config')
  test('all configs have required fields')
  test('all field types are valid')
  test('all field ids are unique within flow')
})

describe('getFlow', () => {
  test('returns correct config by id')
  test('returns undefined for unknown id')
  test('is case sensitive')
})
```

---

## budget-request/schema.test.ts

```typescript
describe('BudgetRequestSchema', () => {
  describe('valid submissions', () => {
    test('complete valid form passes')
    test('optional fields can be omitted')
  })

  describe('title', () => {
    test('empty title fails')
    test('title too long fails')
  })

  describe('amount', () => {
    test('valid amount passes')
    test('negative amount fails')
    test('zero amount fails')
    test('non-number fails')
  })

  describe('category', () => {
    test('valid category passes')
    test('invalid category fails')
  })

  describe('justification', () => {
    test('too short fails')
    test('too long fails')
    test('minimum length passes')
  })

  describe('urgency', () => {
    test('valid urgency passes')
    test('invalid urgency fails')
  })
})
```

---

## leave-request/schema.test.ts

```typescript
describe('LeaveRequestSchema', () => {
  describe('date_range', () => {
    test('valid date range passes')
    test('end before start fails')
    test('same day passes')
    test('missing from date fails')
    test('missing to date fails')
  })

  describe('leave_type', () => {
    test('valid type passes')
    test('invalid type fails')
  })

  describe('reason', () => {
    test('too short fails')
    test('minimum length passes')
  })
})
```

---

## What We Don't Test Here

Not in scope for this prototype:

- Playwright E2E (noted as production next step)
- Supabase integration tests
- Component snapshot tests
- Full auth flow

**Present as:**
"Strategic coverage of business-critical logic —
routing, validation, AI fallback, audit, notifications.
Production would add Playwright E2E across the full
approval flow."

---

## Running Before Every Commit

```bash
npm test && npm run build
```

Both must pass. If either fails, fix before committing.
Claude Code waits for approval before committing.

---

## select-label.test.ts

Tests the label-resolution functions used by `SelectValue` children in
forms that use `@base-ui/react` Select. Verifies that UUID values and
raw enum keys are never surfaced as display text in the UI.

```typescript
describe('getRoleLabel', () => {
  test('returns capitalized label for each role')
  test('returns undefined for empty string (no selection)')
  test('returns undefined for unknown role')
})

describe('getDepartmentLabel', () => {
  test('returns name for each department UUID')
  test('returns undefined for unknown UUID')
  test('never returns a raw UUID as a label')
})
```

See `src/__tests__/select-label.test.ts`.
