# Flows — Mal Approval Engine

## How to Add a New Flow

Adding a flow takes under 5 minutes.
Three steps. One config file. One schema file.
One line in the registry.

---

## Step 1 — Create the config

```bash
mkdir src/flows/[flow-id]
touch src/flows/[flow-id]/config.ts
touch src/flows/[flow-id]/schema.ts
touch src/flows/[flow-id]/schema.test.ts
```

Or use the slash command:
```
/new-flow [flow-id] "[Flow Label]"
```

---

## Step 2 — Define the config

```typescript
// src/flows/leave-request/config.ts
import { FlowConfig } from '@/types/flow.types'

export const LeaveRequestConfig: FlowConfig = {
  id: 'leave-request',
  label: 'Leave Request',
  description: 'Request time off from work',
  icon: 'calendar',
  aiAssistEnabled: false,
  aiPromptContext: `This is a leave request at Mal,
    an Islamic digital bank. Consider team coverage,
    project deadlines, and Islamic holidays.`,
  approvalChain: {
    employee: 'manager',
    manager: 'admin',
    admin: 'self'
  },
  fields: [
    {
      id: 'leave_type',
      label: 'Leave Type',
      type: 'select',
      required: true,
      options: [
        'Annual Leave',
        'Sick Leave',
        'Emergency Leave',
        'Unpaid Leave'
      ]
    },
    {
      id: 'date_range',
      label: 'Dates',
      type: 'daterange',
      required: true,
      hint: 'Select your leave start and end dates'
    },
    {
      id: 'reason',
      label: 'Reason',
      type: 'textarea',
      required: true,
      placeholder: 'Brief reason for leave...',
      aiAssist: false
    },
    {
      id: 'handover_notes',
      label: 'Handover Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Who covers your work?',
      hint: 'Optional — who handles your responsibilities?'
    }
  ]
}
```

---

## Step 3 — Define the schema

```typescript
// src/flows/leave-request/schema.ts
import { z } from 'zod'

export const LeaveRequestSchema = z.object({
  leave_type: z.enum([
    'Annual Leave',
    'Sick Leave',
    'Emergency Leave',
    'Unpaid Leave'
  ], { required_error: 'Please select leave type' }),

  date_range: z.object({
    from: z.string().min(1, 'Start date required'),
    to: z.string().min(1, 'End date required'),
  }).refine(
    (data) => new Date(data.from) <= new Date(data.to),
    { message: 'End date must be after start date' }
  ),

  reason: z.string()
    .min(10, 'Please provide at least 10 characters')
    .max(500, 'Maximum 500 characters'),

  handover_notes: z.string()
    .max(500, 'Maximum 500 characters')
    .optional()
})

export type LeaveRequestData =
  z.infer<typeof LeaveRequestSchema>
```

---

## Step 4 — Register the flow

```typescript
// src/lib/flow-registry.ts
import { BudgetRequestConfig }
  from '@/flows/budget-request/config'
import { LeaveRequestConfig }         // ← add this
  from '@/flows/leave-request/config' // ← add this

export const FLOW_REGISTRY = [
  BudgetRequestConfig,
  LeaveRequestConfig,   // ← add this
]
```

That's it. The engine picks it up automatically.

---

## Budget Request Config (reference)

```typescript
// src/flows/budget-request/config.ts
import { FlowConfig } from '@/types/flow.types'

export const BudgetRequestConfig: FlowConfig = {
  id: 'budget-request',
  label: 'Budget Request',
  description: 'Request approval for a budget item',
  icon: 'wallet',
  aiAssistEnabled: true,
  aiPromptContext: `This is a budget request at Mal,
    an AI-native Islamic digital bank. Flag any
    requests that seem unusually large, vague in
    justification, or potentially non-compliant
    with Islamic finance principles.`,
  approvalChain: {
    employee: 'manager',
    manager: 'admin',
    admin: 'self'
  },
  fields: [
    {
      id: 'title',
      label: 'Request Title',
      type: 'text',
      required: true,
      placeholder: 'Brief title for this request'
    },
    {
      id: 'amount',
      label: 'Amount (AED)',
      type: 'number',
      required: true,
      hint: 'Enter amount in UAE Dirhams'
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        'Software & Tools',
        'Hardware',
        'Travel & Accommodation',
        'Training & Development',
        'Marketing',
        'Operations',
        'Other'
      ]
    },
    {
      id: 'justification',
      label: 'Business Justification',
      type: 'textarea',
      required: true,
      placeholder: 'Why is this needed?',
      hint: 'Be specific about the business need',
      aiAssist: true   // Claude helps write this
    },
    {
      id: 'urgency',
      label: 'Urgency',
      type: 'select',
      required: true,
      options: ['Low', 'Medium', 'High', 'Critical']
    },
    {
      id: 'vendor',
      label: 'Vendor / Supplier',
      type: 'text',
      required: false,
      placeholder: 'Who are you purchasing from?'
    }
  ]
}
```

---

## Planned Flows

### access-request
Fields: system name, access level, reason,
        duration, manager approval note

### vendor-payment
Fields: vendor name, invoice number, amount,
        payment due date, description,
        invoice attachment (future)

### equipment-request
Fields: item description, quantity, estimated cost,
        purpose, urgency

---

## Field Types Reference

| Type | Renders | Notes |
|---|---|---|
| text | Single line input | |
| textarea | Multi-line input | Can have aiAssist |
| number | Number input | Validated > 0 |
| select | Dropdown | Requires options[] |
| date | Date picker | Single date |
| daterange | Calendar picker | Shows team conflicts |
| email | Email input | Validated format |

---

## AI Assist on Fields

When `field.aiAssist === true`:
- A "Help me write this ✨" button appears
- On click: sends all filled fields to Claude
- Claude drafts the textarea content
- User can edit or regenerate
- Only available on textarea fields
- Only when `config.aiAssistEnabled === true`

Privacy notice always shown:
"AI-generated. Do not include PII."
