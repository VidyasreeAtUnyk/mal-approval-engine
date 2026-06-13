import { FlowConfig } from '@/types/flow.types'

export const LeaveRequestConfig: FlowConfig = {
  id: 'leave-request',
  label: 'Leave Request',
  description: 'Request time off from work',
  icon: 'calendar',
  aiAssistEnabled: false,
  aiPromptContext: `This is a leave request at Mal, an Islamic digital bank. Consider team coverage, project deadlines, and Islamic holidays.`,
  approvalChain: {
    employee: 'manager',
    manager: 'admin',
    admin: 'self',
  },
  fields: [
    {
      id: 'leave_type',
      label: 'Leave Type',
      type: 'select',
      required: true,
      options: ['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Unpaid Leave'],
    },
    {
      id: 'date_range',
      label: 'Dates',
      type: 'daterange',
      required: true,
      hint: 'Select your leave start and end dates',
    },
    {
      id: 'reason',
      label: 'Reason',
      type: 'textarea',
      required: true,
      placeholder: 'Brief reason for leave...',
    },
    {
      id: 'handover_notes',
      label: 'Handover Notes',
      type: 'textarea',
      required: false,
      placeholder: 'Who covers your work?',
      hint: 'Optional — who handles your responsibilities?',
    },
  ],
}
