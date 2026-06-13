# Database — Mal Approval Engine

## Overview

Single `requests` table handles all flow types.
Form data stored as JSONB — no schema migration
needed when adding new flows.

---

## Schema

### departments

```sql
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  head_id uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

### profiles

```sql
CREATE TABLE profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  role text CHECK (role IN (
    'employee', 'manager', 'admin'
  )),
  department_id uuid REFERENCES departments(id),
  manager_id uuid REFERENCES profiles(id),
  is_active boolean DEFAULT true,
  invited_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);
```

### requests

```sql
CREATE TABLE requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_type text NOT NULL,
  requester_id uuid REFERENCES profiles(id),
  approver_id uuid REFERENCES profiles(id),
  status text DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'pending', 'approved', 'rejected'
    )),
  form_data jsonb NOT NULL DEFAULT '{}',
  ai_summary text,
  ai_flags jsonb,
  approver_note text,
  idempotency_key text UNIQUE,
  deleted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### request_audit_log

```sql
CREATE TABLE request_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES requests(id),
  changed_by uuid REFERENCES profiles(id),
  from_status text,
  to_status text,
  note text,
  changed_at timestamptz DEFAULT now()
);
```

### notifications

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  request_id uuid REFERENCES requests(id),
  type text CHECK (type IN (
    'request_submitted',
    'request_approved',
    'request_rejected',
    'request_pending_review'
  )),
  title text NOT NULL,
  message text NOT NULL,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### invites

```sql
CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role text,
  department_id uuid REFERENCES departments(id),
  manager_id uuid REFERENCES profiles(id),
  invited_by uuid REFERENCES profiles(id),
  token text UNIQUE,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

---

## Row Level Security

Enable RLS on ALL tables immediately after creation.

```sql
-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_audit_log
  ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- REQUESTS --

-- Employees see only their own
CREATE POLICY "employees_own_requests"
ON requests FOR ALL
USING (
  requester_id = auth.uid()
  AND deleted_at IS NULL
);

-- Managers see their team's requests
CREATE POLICY "managers_team_requests"
ON requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = requests.requester_id
    AND profiles.manager_id = auth.uid()
  )
  AND deleted_at IS NULL
);

-- Managers can update team requests (approve/reject)
CREATE POLICY "managers_update_team_requests"
ON requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = requests.requester_id
    AND profiles.manager_id = auth.uid()
  )
);

-- Admins see and do everything
CREATE POLICY "admins_all_requests"
ON requests FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- PROFILES --

CREATE POLICY "profiles_own"
ON profiles FOR SELECT
USING (id = auth.uid());

CREATE POLICY "managers_see_team"
ON profiles FOR SELECT
USING (manager_id = auth.uid());

CREATE POLICY "admins_all_profiles"
ON profiles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- NOTIFICATIONS --

CREATE POLICY "own_notifications"
ON notifications FOR ALL
USING (user_id = auth.uid());

-- AUDIT LOG --

-- Everyone can read audit for their own requests
CREATE POLICY "audit_own_requests"
ON request_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM requests r
    WHERE r.id = request_audit_log.request_id
    AND r.requester_id = auth.uid()
  )
);

-- Admins see all audit logs
CREATE POLICY "admins_all_audit"
ON request_audit_log FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);

-- DEPARTMENTS --

-- Everyone can read departments
CREATE POLICY "departments_read_all"
ON departments FOR SELECT
USING (true);

-- Only admins can modify
CREATE POLICY "admins_manage_departments"
ON departments FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role = 'admin'
  )
);
```

---

## Indexes

```sql
-- Requests — common query patterns
CREATE INDEX idx_requests_requester
  ON requests(requester_id);

CREATE INDEX idx_requests_approver
  ON requests(approver_id);

CREATE INDEX idx_requests_status
  ON requests(status);

CREATE INDEX idx_requests_flow_type
  ON requests(flow_type);

CREATE INDEX idx_requests_created_at
  ON requests(created_at DESC);

-- Notifications — realtime queries
CREATE INDEX idx_notifications_user
  ON notifications(user_id);

CREATE INDEX idx_notifications_unread
  ON notifications(user_id)
  WHERE read_at IS NULL;

-- Profiles
CREATE INDEX idx_profiles_manager
  ON profiles(manager_id);

CREATE INDEX idx_profiles_department
  ON profiles(department_id);

CREATE INDEX idx_profiles_role
  ON profiles(role);
```

---

## Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

---

## Seed Data

Run after schema to create test accounts.
Do this in Supabase Auth first, then:

```sql
-- After creating auth users, insert profiles

-- Departments first
INSERT INTO departments (id, name)
VALUES
  ('dept-eng-id', 'Engineering'),
  ('dept-fin-id', 'Finance'),
  ('dept-ops-id', 'Operations');

-- Admin (no department, no manager)
INSERT INTO profiles (id, name, email, role)
VALUES (
  '[admin-auth-uid]',
  'Admin User',
  'admin@test.com',
  'admin'
);

-- Manager (Engineering)
INSERT INTO profiles (
  id, name, email, role,
  department_id, manager_id
)
VALUES (
  '[manager-auth-uid]',
  'Manager User',
  'manager@test.com',
  'manager',
  'dept-eng-id',
  '[admin-auth-uid]'
);

-- Employee (Engineering, reports to manager)
INSERT INTO profiles (
  id, name, email, role,
  department_id, manager_id
)
VALUES (
  '[employee-auth-uid]',
  'Employee User',
  'employee@test.com',
  'employee',
  'dept-eng-id',
  '[manager-auth-uid]'
);
```

---

## Key Design Decisions

**Why JSONB for form_data?**
See docs/decisions/002-jsonb-form-data.md

**Why draft status?**
See docs/decisions/004-draft-persistence.md

**Why single requests table?**
See docs/decisions/001-config-driven-flows.md

**Why soft delete?**
Compliance — requests are financial records.
Never hard delete. Use deleted_at timestamp.
is_active on profiles for user deactivation.
