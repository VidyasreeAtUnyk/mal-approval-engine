export type Role = 'employee' | 'manager' | 'admin'

export interface Profile {
  id: string
  name: string
  email: string
  role: Role
  department_id: string | null
  manager_id: string | null
  is_active: boolean
  invited_by: string | null
  created_at: string
}

export interface Department {
  id: string
  name: string
  head_id: string | null
  created_at: string
}
