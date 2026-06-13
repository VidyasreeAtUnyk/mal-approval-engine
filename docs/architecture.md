# Architecture — Mal Approval Engine

## Overview

```mermaid
graph TD
  subgraph Client
    W[Wizard UI]
    N[Notifications Bell]
    D[Dashboard]
    AC[Admin Console]
  end

  subgraph Engine
    AF[ApprovalForm]
    AR[Approval Router]
    AI[AI Insight]
    AU[Audit Logger]
  end

  subgraph Supabase
    DB[(Postgres + RLS)]
    RT[Realtime]
    SU[Auth]
  end

  subgraph External
    AN[Anthropic API]
  end

  W --> AF
  AF --> AR
  AR --> DB
  AU --> DB
  DB --> RT
  RT --> N
  AI --> AN
  AN --> AI
  SU --> Client
```

---

## Core Concept

Every approval flow has the same skeleton:

```
Request Form → Submitted → Under Review → Approved/Rejected
```

What changes between flows:
- Form fields
- Display label
- AI context prompt
- Validation rules

What never changes:
- Auth and routing
- Database structure
- Approval logic
- Notification system
- Audit trail
- UI shell

This means: **build the engine once, add flows forever.**

---

## Config-Driven Engine

```mermaid
graph LR
  C[config.ts] -->|defines fields| AF[ApprovalForm]
  C -->|defines routing| AR[ApprovalRouter]
  C -->|defines AI context| AI[AIInsight]
  FR[flow-registry.ts] -->|imports| C
  AF -->|renders| UI[Any Flow UI]
```

Adding a new flow = one config file + one schema file
+ one line in flow-registry.ts

---

## Folder Structure

```
src/
  flows/                    ← one folder per flow
    budget-request/
      config.ts             ← FlowConfig implementation
      schema.ts             ← Zod validation schema
      schema.test.ts        ← validation tests
    leave-request/
      config.ts
      schema.ts
      schema.test.ts

  engine/                   ← shared, flow-agnostic
    ApprovalForm.tsx        ← renders any flow's form
    RequestCard.tsx         ← renders any request
    ApproverView.tsx        ← approve/reject any request
    AIInsight.tsx           ← Claude summary component
    StatusBadge.tsx         ← shared status display
    CalendarField.tsx       ← date/daterange picker

  lib/
    supabase.ts             ← client-side supabase
    supabase-server.ts      ← server-side supabase
    anthropic.ts            ← claude client (server only)
    flow-registry.ts        ← imports all flow configs
    approval-router.ts      ← routes to correct approver
    audit.ts                ← logs every state change
    notifications.ts        ← creates notifications

  types/
    flow.types.ts           ← FlowConfig, Request types
    profile.types.ts        ← Profile, Role types

  app/
    (auth)/
      login/page.tsx
      invite/[token]/page.tsx

    (employee)/
      dashboard/page.tsx
      [flowType]/
        new/page.tsx
        [id]/page.tsx

    (manager)/
      dashboard/page.tsx
      request/[id]/page.tsx

    (admin)/
      dashboard/page.tsx
      users/page.tsx
      users/invite/page.tsx
      request/[id]/page.tsx

    api/
      requests/route.ts
      requests/[id]/approve/route.ts
      requests/[id]/reject/route.ts
      invites/route.ts
      ai/summarize/route.ts
      ai/assist/route.ts

  components/
    ui/                     ← shadcn components
    layout/
      Header.tsx
      Sidebar.tsx
      RoleGuard.tsx         ← protects routes by role

docs/
  architecture.md           ← this file
  database.md
  flows.md
  security.md
  testing.md
  git.md
  verification.md
  notifications.md
  decisions/
    001-config-driven-flows.md
    002-jsonb-form-data.md
    003-rls-security.md
    004-draft-persistence.md
    005-notification-strategy.md
    006-approval-routing.md
  prompts.md                ← auto-maintained build log
  presentation.md
```

---

## FlowConfig Type

```typescript
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'daterange'    // renders CalendarField
  | 'email'

export interface FlowField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: string[]       // for select fields
  hint?: string            // helper text
  aiAssist?: boolean       // show Help me write button
}

export interface FlowConfig {
  id: string               // kebab-case, matches folder
  label: string            // display name
  description: string      // shown on form
  icon: string             // lucide icon name
  fields: FlowField[]
  aiAssistEnabled: boolean
  aiPromptContext: string  // tells Claude what this is
  approvalChain: {
    employee: 'manager'
    manager: 'admin'
    admin: 'self'
  }
}
```

---

## Approval Flow

```mermaid
sequenceDiagram
  participant E as Employee
  participant S as System
  participant M as Manager
  participant A as Admin

  E->>S: Submit request
  S->>S: Auto-route to approver
  S->>S: Generate Claude AI summary
  S->>S: Save as 'pending'
  S->>M: Send notification
  M->>S: Approve or reject
  S->>S: Log audit entry
  S->>E: Send notification
  Note over E,A: Admin sees everything at all times
```

---

## Role Hierarchy

```mermaid
graph TD
  A[admin] -->|approves requests from| M[manager]
  M -->|approves requests from| E[employee]
  A -->|manages users| U[User Management]
  A -->|sees all| D[All Dashboards]
  M -->|sees own dept| MD[Dept Dashboard]
  E -->|sees own| ED[Own Requests]
```

---

## Draft Persistence

```mermaid
sequenceDiagram
  participant U as User
  participant W as Wizard
  participant S as Supabase

  U->>W: Start new request
  W->>S: Check for existing draft
  S-->>W: Return draft if exists
  W->>U: Pre-fill form with draft
  U->>W: Complete step 1
  W->>S: Save draft (status: draft)
  U->>W: Complete step 2
  W->>S: Update draft
  U->>W: Submit
  W->>S: Update status: pending
  S->>S: Trigger AI summary
  S->>S: Notify approver
```

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        ← public, safe
NEXT_PUBLIC_SUPABASE_ANON_KEY   ← public, safe
SUPABASE_SERVICE_ROLE_KEY       ← server only
ANTHROPIC_API_KEY               ← server only
```
