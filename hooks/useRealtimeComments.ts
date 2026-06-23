'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'
import { useComments, COMMENTS_QUERY_KEY } from '@/hooks/use-comments'
import type { CommentWithAuthor } from '@/types/community'

export function useRealtimeComments(reportId: string) {
  const queryClient = useQueryClient()
  const commentsResult = useComments(reportId)
  const supabase = createClient()

  useEffect(() => {
    const queryKey = [COMMENTS_QUERY_KEY, reportId]

    const channel = supabase
      .channel(`realtime:comments:${reportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `report_id=eq.${reportId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch author profile details
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', payload.new.user_id)
              .single()

            const commentWithAuthor: CommentWithAuthor = {
              id: payload.new.id,
              user_id: payload.new.user_id,
              report_id: payload.new.report_id,
              content: payload.new.content,
              created_at: payload.new.created_at,
              author: {
                full_name: profile?.full_name ?? 'Citizen',
                avatar_url: profile?.avatar_url ?? null,
              },
            }

            queryClient.setQueryData<CommentWithAuthor[]>(queryKey, (old) => {
              if (!old) return [commentWithAuthor]
              if (old.some((c) => c.id === commentWithAuthor.id)) return old
              return [...old, commentWithAuthor]
            })
          } else if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData<CommentWithAuthor[]>(queryKey, (old) => {
              if (!old) return []
              return old.map((c) =>
                c.id === payload.new.id ? { ...c, content: payload.new.content } : c
              )
            })
          } else if (payload.eventType === 'DELETE') {
            const commentId = payload.old.id
            queryClient.setQueryData<CommentWithAuthor[]>(queryKey, (old) => {
              if (!old) return []
              return old.filter((c) => c.id !== commentId)
            })
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [reportId, queryClient, supabase])

  return commentsResult
}
