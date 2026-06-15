import { Skeleton } from '@/components/ui/skeleton'

export default function UsersLoading() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-4 w-52" />
        </div>
        <Skeleton className="h-8 w-28 rounded-mal-8" />
      </div>

      {/* User rows */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-14 rounded-mal-10" />)}
      </div>
    </div>
  )
}
