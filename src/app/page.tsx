import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'

export default async function RootPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') redirect('/admin/dashboard')
  if (profile?.role === 'manager') redirect('/manager/dashboard')
  redirect('/dashboard')
}
