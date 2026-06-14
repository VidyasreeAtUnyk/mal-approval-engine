'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types/profile.types'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError) console.error('[useProfile] auth error:', authError)
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) console.error('[useProfile] profiles fetch error:', error)
      setProfile(data)
      setLoading(false)
    }

    load()
  }, [])

  return { profile, loading }
}
