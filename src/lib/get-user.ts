import { cache } from 'react'
import { createServerClient } from './supabase-server'

// Deduplicates getUser() within a single server render pass.
// Safe to call from multiple server components on the same page.
export const getUser = cache(async () => {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
