'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RoleGuard } from '@/components/layout/RoleGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase'

const DEPARTMENTS = [
  { id: 'a1b2c3d4-0001-0001-0001-000000000001', name: 'Engineering' },
  { id: 'a1b2c3d4-0002-0002-0002-000000000002', name: 'Finance' },
  { id: 'a1b2c3d4-0003-0003-0003-000000000003', name: 'Operations' },
]

interface Manager { id: string; name: string }

function InviteForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<string>('')
  const [departmentId, setDepartmentId] = useState<string>('')
  const [managerId, setManagerId] = useState<string>('')
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(false)

  // Load managers for the employee manager assignment field
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, name')
      .eq('role', 'manager')
      .eq('is_active', true)
      .order('name')
      .then(({ data }) => setManagers((data ?? []) as Manager[]))
  }, [])

  // Reset manager when role changes away from employee
  function handleRoleChange(v: string | null) {
    setRole(v ?? '')
    if (v !== 'employee') setManagerId('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !role) return
    setLoading(true)

    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role,
          department_id: departmentId || null,
          manager_id: managerId || null,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error?.message ?? 'Failed to send invite.')
        return
      }
      toast.success(`Invite sent to ${email}`)
      router.push('/admin/users')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--mal-text-sub-600)] hover:text-[var(--mal-text-strong-950)] transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Users
      </Link>

      <Card className="border-[var(--mal-stroke-soft-200)] shadow-mal-xs p-4 md:p-6">
        <CardHeader>
          <CardTitle className="text-lg text-[var(--mal-text-strong-950)]">Invite User</CardTitle>
          <CardDescription className="text-[var(--mal-text-sub-600)] mb-2">
            Send an invite link to a new team member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[var(--mal-text-strong-950)]">Email address</Label>
              <Input
                type="email"
                placeholder="colleague@mal.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="border-[var(--mal-stroke-soft-200)]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[var(--mal-text-strong-950)]">Role</Label>
              <Select value={role} onValueChange={handleRoleChange} required>
                <SelectTrigger className="border-[var(--mal-stroke-soft-200)]">
                  <SelectValue placeholder="Select role">
                    {role ? { employee: 'Employee', manager: 'Manager', admin: 'Admin' }[role] : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manager assignment — only for employees */}
            {role === 'employee' && (
              <div className="space-y-1.5">
                <Label className="text-[var(--mal-text-strong-950)]">
                  Manager <span className="text-[var(--mal-text-soft-400)]">(optional)</span>
                </Label>
                <Select value={managerId} onValueChange={(v) => setManagerId(v ?? '')}>
                  <SelectTrigger className="border-[var(--mal-stroke-soft-200)]">
                    <SelectValue placeholder="Assign a manager">
                      {managerId ? managers.find(m => m.id === managerId)?.name : undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-[var(--mal-text-strong-950)]">
                Department <span className="text-[var(--mal-text-soft-400)]">(optional)</span>
              </Label>
              <Select value={departmentId} onValueChange={(v) => setDepartmentId(v ?? '')}>
                <SelectTrigger className="border-[var(--mal-stroke-soft-200)]">
                  <SelectValue placeholder="Select department">
                    {departmentId ? DEPARTMENTS.find(d => d.id === departmentId)?.name : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={loading || !email || !role}
              className="w-full bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white"
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvitePage() {
  return (
    <RoleGuard allowedRoles={['admin']}>
      <InviteForm />
    </RoleGuard>
  )
}
