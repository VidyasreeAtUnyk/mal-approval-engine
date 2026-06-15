'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut } from 'lucide-react'
import { NotificationBell } from './NotificationBell'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { profile } = useProfile()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] shrink-0 px-4">
      <div className="flex items-center justify-between h-full max-w-screen-xl mx-auto">
      {/* Logo — offset on mobile to clear the hamburger button */}
      <div className="flex items-center gap-2 pl-8 md:pl-0">
        <div className="w-7 h-7 rounded-full bg-[var(--mal-purple-500)] flex items-center justify-center">
          <span className="text-white" style={{ fontSize: '9px', fontWeight: 700 }}>مال</span>
        </div>
        <span className="font-semibold text-sm text-[var(--mal-text-strong-950)]">
          Mal Approvals
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <NotificationBell />

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]"
          aria-label="Toggle dark mode"
        >
          {mounted && (theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
        </Button>

        {/* User + sign out — fixed-width placeholder prevents CLS while profile loads */}
        <div className="flex items-center gap-2">
          {profile ? (
            <>
              <div className="text-right hidden sm:block">
                <p className="text-xs font-medium text-[var(--mal-text-strong-950)]">{profile.name}</p>
                <p className="text-xs text-[var(--mal-text-soft-400)] capitalize">{profile.role}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-[var(--mal-alpha-purple-10)] border border-[var(--mal-alpha-purple-24)] flex items-center justify-center">
                <span className="text-xs font-semibold text-[var(--mal-purple-600)]">
                  {profile.name[0].toUpperCase()}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-8 w-8 text-[var(--mal-text-soft-400)] hover:text-destructive hover:bg-red-50"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <div className="hidden sm:flex flex-col items-end gap-1">
                <div className="h-3 w-20 rounded bg-[var(--mal-bg-soft-200)] animate-pulse" />
                <div className="h-3 w-12 rounded bg-[var(--mal-bg-soft-200)] animate-pulse" />
              </div>
              <div className="w-7 h-7 rounded-full bg-[var(--mal-bg-soft-200)] animate-pulse" />
              <div className="w-8 h-8 rounded bg-[var(--mal-bg-soft-200)] animate-pulse" />
            </>
          )}
        </div>
      </div>
      </div>
    </header>
  )
}
