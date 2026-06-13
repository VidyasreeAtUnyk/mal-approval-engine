import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, AlertTriangle } from 'lucide-react'

interface AIInsightProps {
  summary: string | null
  flags: string[] | null
  loading?: boolean
}

export function AIInsight({ summary, flags, loading }: AIInsightProps) {
  if (loading) {
    return (
      <div className="rounded-mal-10 border border-[var(--mal-alpha-purple-24)] bg-[var(--mal-alpha-purple-8)] p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--mal-purple-500)]" />
          <span className="text-sm font-medium text-[var(--mal-purple-600)]">AI Analysis</span>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="rounded-mal-10 border border-[var(--mal-alpha-purple-24)] bg-[var(--mal-alpha-purple-8)] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[var(--mal-purple-500)]" />
        <span className="text-sm font-semibold text-[var(--mal-purple-600)]">AI Analysis</span>
      </div>

      <p className="text-sm text-[var(--mal-text-sub-600)] leading-relaxed">{summary}</p>

      {flags && flags.length > 0 && (
        <div className="space-y-1.5">
          {flags.map((flag, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-400">{flag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
