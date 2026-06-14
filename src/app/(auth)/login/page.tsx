'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Invalid email or password.')
      setLoading(false)
      return
    }

    // Read role from DB to decide where to redirect
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard')
    } else if (profile?.role === 'manager') {
      router.push('/manager/dashboard')
    } else {
      router.push('/dashboard')
    }

    router.refresh()
  }

  return (
    <Card className="shadow-mal-fancy-stroke border-[var(--mal-stroke-soft-200)] p-4 md:p-6">
      <CardHeader className="space-y-1 pb-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[var(--mal-purple-500)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">مال</span>
          </div>
          <span className="font-semibold text-[var(--mal-text-strong-950)]">Mal</span>
        </div>
        <CardTitle className="text-xl text-[var(--mal-text-strong-950)]">Sign in</CardTitle>
        <CardDescription className="text-[var(--mal-text-sub-600)]">
          Enter your credentials to access the approval engine
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[var(--mal-text-strong-950)]">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@mal.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="border-[var(--mal-stroke-soft-200)] focus-visible:ring-[var(--mal-alpha-purple-24)]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[var(--mal-text-strong-950)]">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="border-[var(--mal-stroke-soft-200)] focus-visible:ring-[var(--mal-alpha-purple-24)]"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
