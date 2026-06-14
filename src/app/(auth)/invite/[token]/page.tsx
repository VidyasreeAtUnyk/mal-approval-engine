'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

interface InviteData {
  email: string
  role: string
}

interface PageProps {
  params: { token: string }
}

export default function InviteAcceptPage({ params }: PageProps) {
  const { token } = params
  const router = useRouter()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Validate token on mount
  useEffect(() => {
    async function loadInvite() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('invites')
        .select('email, role, expires_at, accepted_at')
        .eq('token', token)
        .single()

      if (error || !data) {
        setLoadError('Invalid invite link.')
        setLoadingInvite(false)
        return
      }

      if (data.accepted_at) {
        setLoadError('This invite has already been used.')
        setLoadingInvite(false)
        return
      }

      if (new Date(data.expires_at) < new Date()) {
        setLoadError('This invite has expired.')
        setLoadingInvite(false)
        return
      }

      setInvite({ email: data.email, role: data.role })
      setLoadingInvite(false)
    }

    loadInvite()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!name.trim()) {
      setFormError('Full name is required.')
      return
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setFormError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: name.trim(), password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setFormError(json.error?.message ?? 'Something went wrong. Please try again.')
        return
      }

      // Sign in with the newly created account
      const supabase = createClient()
      await supabase.auth.signInWithPassword({
        email: invite!.email,
        password,
      })

      const role = json.data?.role
      if (role === 'admin') router.push('/admin/dashboard')
      else if (role === 'manager') router.push('/manager/dashboard')
      else router.push('/dashboard')
    } catch {
      setFormError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--mal-bg-weak-50)]">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--mal-text-soft-400)]" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--mal-bg-weak-50)] p-4">
        <Card className="w-full max-w-sm border-[var(--mal-stroke-soft-200)] shadow-mal-xs">
          <CardContent className="py-6 flex flex-col items-center text-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <p className="font-medium text-[var(--mal-text-strong-950)]">{loadError}</p>
            <p className="text-sm text-[var(--mal-text-soft-400)]">
              Contact your admin to request a new invite.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--mal-bg-weak-50)] p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--mal-purple-500)] flex items-center justify-center">
            <span className="text-white text-xs font-bold">مال</span>
          </div>
          <span className="font-semibold text-[var(--mal-text-strong-950)]">Mal Approvals</span>
        </div>

        <Card className="border-[var(--mal-stroke-soft-200)] shadow-mal-fancy-stroke p-4 md:p-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-[var(--mal-text-strong-950)]">
              Accept your invite
            </CardTitle>
            <CardDescription className="text-[var(--mal-text-sub-600)]">
              You&apos;ve been invited as <span className="font-medium capitalize">{invite?.role}</span> · {invite?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[var(--mal-text-strong-950)]">Full name</Label>
                <Input
                  placeholder="Your full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="border-[var(--mal-stroke-soft-200)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[var(--mal-text-strong-950)]">Password</Label>
                <Input
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="border-[var(--mal-stroke-soft-200)]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[var(--mal-text-strong-950)]">Confirm password</Label>
                <Input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="border-[var(--mal-stroke-soft-200)]"
                />
              </div>

              {formError && (
                <p className="text-sm text-destructive">{formError}</p>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-[var(--mal-purple-500)] hover:bg-[var(--mal-purple-600)] text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating account…
                  </>
                ) : (
                  'Create account'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
