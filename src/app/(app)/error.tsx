'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-red-500" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-[var(--mal-text-strong-950)]">Something went wrong</h2>
        <p className="text-sm text-[var(--mal-text-sub-600)] mt-1">An unexpected error occurred. Please try again.</p>
      </div>
      <Button
        onClick={reset}
        className="bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white"
      >
        Try again
      </Button>
    </div>
  )
}
