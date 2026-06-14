'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

interface FilterBarProps {
  departments: { id: string; name: string }[]
  flows: { id: string; label: string }[]
  current: { dept?: string; flow?: string; status?: string; date?: string }
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const DATE_LABELS: Record<string, string> = {
  week: 'This Week',
  month: 'This Month',
}

export function FilterBar({ departments, flows, current }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  // When searchParams settle (server re-render complete), clear loading
  useEffect(() => {
    setLoading(false)
  }, [searchParams])

  function update(key: string, value: string | null) {
    setLoading(true)
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') params.set(key, value)
    else params.delete(key)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={current.dept ?? 'all'} onValueChange={(v) => update('dept', v ?? null)}>
        <SelectTrigger className="w-44 border-[var(--mal-stroke-soft-200)] h-8 text-sm">
          <SelectValue placeholder="All Departments">
            {current.dept ? (departments.find(d => d.id === current.dept)?.name ?? 'All Departments') : 'All Departments'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Departments</SelectItem>
          {departments.map(d => (
            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={current.flow ?? 'all'} onValueChange={(v) => update('flow', v ?? null)}>
        <SelectTrigger className="w-40 border-[var(--mal-stroke-soft-200)] h-8 text-sm">
          <SelectValue placeholder="All Flows">
            {current.flow ? (flows.find(f => f.id === current.flow)?.label ?? 'All Flows') : 'All Flows'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Flows</SelectItem>
          {flows.map(f => (
            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={current.status ?? 'all'} onValueChange={(v) => update('status', v ?? null)}>
        <SelectTrigger className="w-32 border-[var(--mal-stroke-soft-200)] h-8 text-sm">
          <SelectValue placeholder="All Statuses">
            {current.status ? (STATUS_LABELS[current.status] ?? 'All Statuses') : 'All Statuses'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
        </SelectContent>
      </Select>

      <Select value={current.date ?? 'all'} onValueChange={(v) => update('date', v ?? null)}>
        <SelectTrigger className="w-36 border-[var(--mal-stroke-soft-200)] h-8 text-sm">
          <SelectValue placeholder="All Time">
            {current.date ? (DATE_LABELS[current.date] ?? 'All Time') : 'All Time'}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
        </SelectContent>
      </Select>

      {loading && (
        <Loader2 className="h-4 w-4 animate-spin text-[var(--mal-text-soft-400)]" />
      )}
    </div>
  )
}
