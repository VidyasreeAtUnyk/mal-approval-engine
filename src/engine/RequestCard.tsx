import Link from 'next/link'
import { Request } from '@/types/flow.types'
import { StatusBadge } from './StatusBadge'
import { getFlow } from '@/lib/flow-registry'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle } from 'lucide-react'

interface RequestCardProps {
  request: Request
  href: string
}

export function RequestCard({ request, href }: RequestCardProps) {
  const flow = getFlow(request.flow_type)
  const label = flow?.label ?? request.flow_type
  const formData = request.form_data as Record<string, unknown>

  // Surface the most meaningful field for each flow type
  const primaryValue =
    (formData.title as string) ||
    (formData.leave_type as string) ||
    label

  const amount = formData.amount ? `AED ${Number(formData.amount).toLocaleString()}` : null
  const hasFlags = request.ai_flags && (request.ai_flags as string[]).length > 0

  return (
    <Link href={href}>
      <div className="group rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] p-4 shadow-mal-xs hover:shadow-mal-fancy-neutral hover:border-[var(--mal-alpha-purple-24)] transition-all cursor-pointer mb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[var(--mal-text-soft-400)] uppercase tracking-wide">
                {label}
              </span>
              {hasFlags && (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-sm font-medium text-[var(--mal-text-strong-950)] truncate">
              {primaryValue}
            </p>
            {amount && (
              <p className="text-sm text-[var(--mal-purple-500)] font-medium mt-0.5">{amount}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <StatusBadge status={request.status} />
            <span className="text-xs text-[var(--mal-text-soft-400)]">
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
