'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/community'

interface RealtimeListenerProps {
  userId: string | null
}

export function RealtimeListener({ userId }: RealtimeListenerProps) {
  const queryClient = useQueryClient()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification

          toast(newNotification.title, {
            description: newNotification.message,
            icon: <Bell className="h-4 w-4 text-blue-400" />,
            action: newNotification.report_id
              ? {
                  label: 'View',
                  onClick: () => router.push(`/report/${newNotification.report_id}`),
                }
              : undefined,
          })

          queryClient.setQueryData<Notification[]>(['notifications'], (old) => {
            if (!old) return [newNotification]
            if (old.some((n) => n.id === newNotification.id)) return old
            return [newNotification, ...old]
          })

          queryClient.setQueryData<any[]>(['notifications-badge', userId], (old) => {
            if (!old) return [{ id: newNotification.id, read: false }]
            if (old.some((n) => n.id === newNotification.id)) return old
            return [{ id: newNotification.id, read: false }, ...old]
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, queryClient, router])

  return null
}
