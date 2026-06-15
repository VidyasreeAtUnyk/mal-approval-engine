import { Skeleton } from '@/components/ui/skeleton'

export default function ManagerDashboardLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-60 mt-1.5" />
      </div>

      {/* Pending section */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-mal-10" />)}
      </div>

      {/* Resolved section */}
      <div className="space-y-2">
        <Skeleton className="h-5 w-40" />
        {[1, 2].map(i => <Skeleton key={i} className="h-16 rounded-mal-10" />)}
      </div>
    </div>
  )
}
