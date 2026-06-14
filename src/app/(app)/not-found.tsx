import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
      <p className="text-5xl font-bold text-[var(--mal-text-soft-400)]">404</p>
      <div>
        <h2 className="text-base font-semibold text-[var(--mal-text-strong-950)]">Page not found</h2>
        <p className="text-sm text-[var(--mal-text-sub-600)] mt-1">
          This page doesn&apos;t exist or was removed.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--mal-purple-500)] hover:text-[var(--mal-purple-600)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
    </div>
  )
}
