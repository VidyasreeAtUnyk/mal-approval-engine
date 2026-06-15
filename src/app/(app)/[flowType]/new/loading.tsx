import { Skeleton } from '@/components/ui/skeleton'

export default function NewRequestLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + header */}
      <div>
        <Skeleton className="h-4 w-20 mb-3" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64 mt-1.5" />
      </div>

      {/* Form fields */}
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full rounded-mal-8" />
          </div>
        ))}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-24 w-full rounded-mal-8" />
        </div>
      </div>

      {/* Submit button */}
      <Skeleton className="h-9 w-32 rounded-mal-8" />
    </div>
  )
}
