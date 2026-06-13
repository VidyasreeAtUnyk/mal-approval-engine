import { RequestStatus } from '@/types/flow.types'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<RequestStatus, { label: string; classes: string }> = {
  draft: {
    label: 'Draft',
    classes: 'bg-[var(--mal-bg-soft-200)] text-[var(--mal-text-sub-600)]',
  },
  pending: {
    label: 'Pending Review',
    classes: 'bg-[var(--mal-alpha-purple-10)] text-[var(--mal-purple-600)] border border-[var(--mal-alpha-purple-24)]',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  },
  rejected: {
    label: 'Rejected',
    classes: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  },
}

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, classes } = STATUS_CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        classes,
        className
      )}
    >
      {label}
    </span>
  )
}
