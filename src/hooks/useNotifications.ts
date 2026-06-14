'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { Notification } from '@/types/flow.types'

export type NotificationWithFlow = Notification & { requests: { flow_type: string } | null }

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationWithFlow[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const fetchNotifications = useCallback(async () => {
    const res = await fetch('/api/notifications')
    if (!res.ok) return
    const { data } = await res.json()
    if (data) setNotifications(data)
  }, [])

  // Get user ID once on mount so we can filter the realtime channel
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    fetchNotifications().finally(() => setLoading(false))
  }, [fetchNotifications])

  // Realtime subscription — only after we have the user ID
  useEffect(() => {
    if (!userId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  const markAllRead = useCallback(async () => {
    await fetch('/api/notifications/read', { method: 'PATCH' })
    setNotifications(prev =>
      prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    )
  }, [])

  const unreadCount = notifications.filter(n => !n.read_at).length

  return { notifications, unreadCount, loading, markAllRead, refetch: fetchNotifications }
}
