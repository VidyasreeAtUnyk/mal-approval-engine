export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'date'
  | 'daterange'
  | 'email'

export interface FlowField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  options?: string[]
  hint?: string
  aiAssist?: boolean
}

export interface FlowConfig {
  id: string
  label: string
  description: string
  icon: string
  fields: FlowField[]
  aiAssistEnabled: boolean
  aiPromptContext: string
  approvalChain: {
    employee: 'manager'
    manager: 'admin'
    admin: 'self'
  }
}

export type RequestStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface Request {
  id: string
  flow_type: string
  requester_id: string
  approver_id: string | null
  status: RequestStatus
  form_data: Record<string, unknown>
  ai_summary: string | null
  ai_flags: string[] | null
  approver_note: string | null
  idempotency_key: string | null
  deleted_at: string | null
  created_at: string
  updated_at: string
}

export interface AuditEntry {
  id: string
  request_id: string
  changed_by: string
  from_status: string | null
  to_status: string
  note: string | null
  changed_at: string
}

export interface Notification {
  id: string
  user_id: string
  request_id: string
  type: NotificationType
  title: string
  message: string
  read_at: string | null
  created_at: string
}

export type NotificationType =
  | 'request_submitted'
  | 'request_approved'
  | 'request_rejected'
  | 'request_pending_review'
