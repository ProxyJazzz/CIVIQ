'use client'

import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import { updatePresence } from '@/lib/realtime/update-presence'
import type { ActivePresence } from '@/types/community'

interface PresenceTrackState {
  user_id: string
  full_name?: string | null
  avatar_url?: string | null
  status?: 'online' | 'offline' | 'away'
  last_seen_at?: string
}

export function usePresence(
  userId: string | null,
  profile?: { full_name: string | null; avatar_url: string | null } | null
) {
  const [onlineUsers, setOnlineUsers] = useState<ActivePresence[]>([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('civiq_presence_layer')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const formatted: ActivePresence[] = []

        Object.keys(state).forEach((key) => {
          const userPresences = state[key] as unknown as PresenceTrackState[]
          if (userPresences && userPresences.length > 0) {
            const latest = userPresences[userPresences.length - 1]
            if (latest.user_id) {
              formatted.push({
                user_id: latest.user_id,
                status: latest.status || 'online',
                last_seen_at: latest.last_seen_at || new Date().toISOString(),
                full_name: latest.full_name,
                avatar_url: latest.avatar_url,
              })
            }
          }
        })

        // Deduplicate and filter out any invalid users
        setOnlineUsers(formatted)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return

        if (userId) {
          await updatePresence('online').catch(console.error)

          await channel.track({
            user_id: userId,
            full_name: profile?.full_name || 'Citizen',
            avatar_url: profile?.avatar_url || null,
            status: 'online',
            last_seen_at: new Date().toISOString(),
          })
        }
      })

    const handleVisibilityChange = async () => {
      if (!userId) return

      const isVisible = document.visibilityState === 'visible'
      const status: 'online' | 'away' = isVisible ? 'online' : 'away'

      await updatePresence(status).catch(console.error)
      await channel.track({
        user_id: userId,
        full_name: profile?.full_name || 'Citizen',
        avatar_url: profile?.avatar_url || null,
        status,
        last_seen_at: new Date().toISOString(),
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (userId) {
        void updatePresence('offline').catch(console.error)
      }
      void supabase.removeChannel(channel)
    }
  }, [userId, profile?.full_name, profile?.avatar_url, supabase])

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
  }
}
