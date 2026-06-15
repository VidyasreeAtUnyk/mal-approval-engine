'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Flow {
  id: string
  label: string
}

interface NewRequestMenuProps {
  flows: Flow[]
}

export function NewRequestMenu({ flows }: NewRequestMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ≤ 2 flows: individual buttons
  if (flows.length <= 2) {
    return (
      <div className="flex flex-wrap gap-2">
        {flows.map(flow => (
          <Link
            key={flow.id}
            href={`/${flow.id}/new`}
            className="inline-flex items-center gap-1.5 rounded-mal-8 bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white text-sm font-medium px-3 py-1.5 transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            {flow.label}
          </Link>
        ))}
      </div>
    )
  }

  // > 2 flows: single dropdown button
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="New request"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-1.5 rounded-mal-8 bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white text-sm font-medium px-3 py-1.5 transition-colors"
      >
        <PlusCircle className="h-4 w-4" />
        New Request
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1 w-52 rounded-mal-10 border border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] shadow-mal-fancy-stroke z-20 py-1">
          {flows.map(flow => (
            <Link
              key={flow.id}
              href={`/${flow.id}/new`}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)] hover:text-[var(--mal-text-strong-950)] transition-colors"
            >
              <PlusCircle className="h-3.5 w-3.5 text-[var(--mal-purple-500)] shrink-0" />
              {flow.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
