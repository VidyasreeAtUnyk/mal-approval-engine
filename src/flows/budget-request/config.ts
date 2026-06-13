import { FlowConfig } from '@/types/flow.types'

export const BudgetRequestConfig: FlowConfig = {
  id: 'budget-request',
  label: 'Budget Request',
  description: 'Request approval for a budget item',
  icon: 'wallet',
  aiAssistEnabled: true,
  aiPromptContext: `This is a budget request at Mal, an AI-native Islamic digital bank. Flag any requests that seem unusually large, vague in justification, or potentially non-compliant with Islamic finance principles.`,
  approvalChain: {
    employee: 'manager',
    manager: 'admin',
    admin: 'self',
  },
  fields: [
    {
      id: 'title',
      label: 'Request Title',
      type: 'text',
      required: true,
      placeholder: 'Brief title for this request',
    },
    {
      id: 'amount',
      label: 'Amount (AED)',
      type: 'number',
      required: true,
      hint: 'Enter amount in UAE Dirhams',
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
        'Other',
      ],
    },
    {
      id: 'justification',
      label: 'Business Justification',
      type: 'textarea',
      required: true,
      placeholder: 'Why is this needed?',
      hint: 'Be specific about the business need',
      aiAssist: true,
    },
    {
      id: 'urgency',
      label: 'Urgency',
      type: 'select',
      required: true,
      options: ['Low', 'Medium', 'High', 'Critical'],
    },
    {
      id: 'vendor',
      label: 'Vendor / Supplier',
      type: 'text',
      required: false,
      placeholder: 'Who are you purchasing from?',
    },
  ],
}
