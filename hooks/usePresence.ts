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

// Instantiate Supabase client at module scope to avoid recreate on every render
const supabase = createClient()

export function usePresence(
  userId: string | null,
  profile?: { full_name: string | null; avatar_url: string | null } | null
) {
  const [onlineUsers, setOnlineUsers] = useState<ActivePresence[]>([])

  useEffect(() => {
    // Unique channel identifier for each session to avoid colliding subscriptions
    const channelName = `civiq_presence_layer_${userId ?? 'guest'}_${Date.now()}`
    const channel = supabase.channel(channelName)

    const fullName = profile?.full_name
    const avatarUrl = profile?.avatar_url

    // 1. Register presence callbacks BEFORE calling subscribe()
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

        setOnlineUsers(formatted)
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return

        if (userId) {
          // Sync database state to online
          await updatePresence('online').catch(console.error)

          // Track state in presence channel
          await channel.track({
            user_id: userId,
            full_name: fullName || 'Citizen',
            avatar_url: avatarUrl || null,
            status: 'online',
            last_seen_at: new Date().toISOString(),
          })
        }
      })

    // 2. Browser tab focus synchronization handler
    const handleVisibilityChange = async () => {
      if (!userId) return

      const isVisible = document.visibilityState === 'visible'
      const status: 'online' | 'away' = isVisible ? 'online' : 'away'

      await updatePresence(status).catch(console.error)
      await channel.track({
        user_id: userId,
        full_name: fullName || 'Citizen',
        avatar_url: avatarUrl || null,
        status,
        last_seen_at: new Date().toISOString(),
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 3. Clean up subscription and visibility listener on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (userId) {
        void updatePresence('offline').catch(console.error)
      }
      void channel.unsubscribe()
      void supabase.removeChannel(channel)
    }
  }, [userId, profile?.full_name, profile?.avatar_url])

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
  }
}
