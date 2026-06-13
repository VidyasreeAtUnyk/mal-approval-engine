'use client'

import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Sun, Moon, LogOut } from 'lucide-react'

export function Header() {
  const { theme, setTheme } = useTheme()
  const { profile } = useProfile()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-[var(--mal-stroke-soft-200)] bg-[var(--mal-bg-white-0)] flex items-center justify-between px-4 shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-mal-8 bg-[var(--mal-purple-500)] flex items-center justify-center">
          <span className="text-white text-xs font-bold">M</span>
        </div>
        <span className="font-semibold text-sm text-[var(--mal-text-strong-950)]">
          Mal Approvals
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notification bell placeholder — replaced in Phase 8 */}
        <div id="notification-bell-portal" />

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-8 w-8 text-[var(--mal-text-sub-600)] hover:bg-[var(--mal-bg-weak-50)]"
          aria-label="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* User + sign out */}
        {profile && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
      </div>
    </header>
  )
}
