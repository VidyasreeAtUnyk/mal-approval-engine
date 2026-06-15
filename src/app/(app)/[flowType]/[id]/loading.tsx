import { Skeleton } from '@/components/ui/skeleton'

export default function RequestDetailLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + title */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>

      {/* AI summary card */}
      <Skeleton className="h-28 rounded-mal-10" />

      {/* Request details grid */}
      <div>
        <Skeleton className="h-5 w-32 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 rounded-mal-8" />)}
        </div>
      </div>

      {/* Audit log */}
      <div>
        <Skeleton className="h-5 w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 rounded-mal-8" />)}
        </div>
      </div>
    </div>
  )
}
