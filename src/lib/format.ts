import { format } from 'date-fns'

/** Formats a stored date_range object as a human-readable string. */
export function formatDateRange(val: unknown): string {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const r = val as { from?: string; to?: string }
    const from = r.from ? format(new Date(r.from), 'MMM d, yyyy') : ''
    const to = r.to ? format(new Date(r.to), 'MMM d, yyyy') : ''
    if (from && to && from !== to) return `${from} → ${to}`
    if (from || to) return from || to
  }
  return JSON.stringify(val)
}
