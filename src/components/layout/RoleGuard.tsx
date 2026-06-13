'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Role } from '@/types/profile.types'
import { Skeleton } from '@/components/ui/skeleton'

interface RoleGuardProps {
  allowedRoles: Role[]
  children: React.ReactNode
}

export function RoleGuard({ allowedRoles, children }: RoleGuardProps) {
  const { profile, loading } = useProfile()
  const router = useRouter()

  useEffect(() => {
    if (!loading && profile && !allowedRoles.includes(profile.role)) {
      router.replace('/dashboard')
    }
  }, [loading, profile, allowedRoles, router])

  if (loading) {
    return (
      <div className="p-8 space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    )
  }

  if (!profile || !allowedRoles.includes(profile.role)) {
    return null
  }

  return <>{children}</>
}
