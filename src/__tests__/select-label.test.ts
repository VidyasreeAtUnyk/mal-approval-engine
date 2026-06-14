/**
 * Tests for Select label resolution.
 *
 * @base-ui/react SelectValue does not automatically render the children of the
 * matching SelectItem. For non-trivial values (UUIDs, raw keys) you must pass
 * an explicit label as children to SelectValue. These tests verify the lookup
 * functions that produce those labels.
 *
 * Pattern used in the codebase:
 *   <SelectValue placeholder="Select role">
 *     {role ? ROLE_LABELS[role] : undefined}
 *   </SelectValue>
 */

// --- Role labels (invite form) ---

const ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'Admin',
}

function getRoleLabel(value: string): string | undefined {
  return ROLE_LABELS[value]
}

// --- Department labels (invite form) ---

const DEPARTMENTS = [
  { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Engineering' },
  { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Finance' },
  { id: 'a1b2c3d4-0003-0003-0003-000000000003', name: 'Operations' },
]

function getDepartmentLabel(id: string): string | undefined {
  return DEPARTMENTS.find(d => d.id === id)?.name
}

// -------------------------------------------------------------------------

describe('getRoleLabel', () => {
  test('returns capitalized label for employee', () => {
    expect(getRoleLabel('employee')).toBe('Employee')
  })

  test('returns capitalized label for manager', () => {
    expect(getRoleLabel('manager')).toBe('Manager')
  })

  test('returns capitalized label for admin', () => {
    expect(getRoleLabel('admin')).toBe('Admin')
  })

  test('returns undefined for unknown role', () => {
    expect(getRoleLabel('superuser')).toBeUndefined()
  })

  test('returns undefined for empty string (no selection)', () => {
    expect(getRoleLabel('')).toBeUndefined()
  })
})

describe('getDepartmentLabel', () => {
  test('returns name for Engineering UUID', () => {
    expect(getDepartmentLabel('a1b2c3d4-0001-0001-0001-000000000001')).toBe('Engineering')
  })

  test('returns name for Finance UUID', () => {
    expect(getDepartmentLabel('a1b2c3d4-0002-0002-0002-000000000002')).toBe('Finance')
  })

  test('returns name for Operations UUID', () => {
    expect(getDepartmentLabel('a1b2c3d4-0003-0003-0003-000000000003')).toBe('Operations')
  })

  test('returns undefined for unknown UUID', () => {
    expect(getDepartmentLabel('00000000-0000-0000-0000-000000000000')).toBeUndefined()
  })

  test('returns undefined for empty string (no selection)', () => {
    expect(getDepartmentLabel('')).toBeUndefined()
  })

  test('never returns a raw UUID as a label', () => {
    DEPARTMENTS.forEach(d => {
      const label = getDepartmentLabel(d.id)
      expect(label).not.toMatch(/^[0-9a-f-]{36}$/)
    })
  })
})
