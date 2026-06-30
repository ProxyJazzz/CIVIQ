'use client'

import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'
import { REPORTS_QUERY_KEY } from '@/hooks/use-reports'
import type { FeedPage, ReportWithStats } from '@/types/community'

export function useRealtimeVotes(reportId: string, currentUserId: string | null) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:votes:${reportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `report_id=eq.${reportId}`,
        },
        async (payload) => {
          // Fetch updated vote count from the stats view
          const { data } = await supabase
            .from('reports_with_stats')
            .select('vote_count')
            .eq('id', reportId)
            .single()

          const voteCount = data?.vote_count

          if (voteCount !== undefined && voteCount !== null) {
            // 1. Update report detail cache
            queryClient.setQueriesData<ReportWithStats>(
              { queryKey: ['report', reportId] },
              (oldReport) => {
                if (!oldReport) return oldReport

                let userHasVoted = oldReport.user_has_voted
                if (currentUserId) {
                  if (payload.eventType === 'INSERT' && payload.new.user_id === currentUserId) {
                    userHasVoted = true
                  } else if (payload.eventType === 'DELETE' && payload.old.user_id === currentUserId) {
                    userHasVoted = false
                  }
                }

                return {
                  ...oldReport,
                  vote_count: voteCount,
                  user_has_voted: userHasVoted,
                }
              }
            )

            // 2. Update reports feed list cache
            queryClient.setQueriesData<InfiniteData<FeedPage>>(
              { queryKey: [REPORTS_QUERY_KEY] },
              (oldFeed) => {
                if (!oldFeed) return oldFeed
                return {
                  ...oldFeed,
                  pages: oldFeed.pages.map((page) => ({
                    ...page,
                    reports: page.reports.map((r) => {
                      if (r.id !== reportId) return r

                      let userHasVoted = r.user_has_voted
                      if (currentUserId) {
                        if (payload.eventType === 'INSERT' && payload.new.user_id === currentUserId) {
                          userHasVoted = true
                        } else if (payload.eventType === 'DELETE' && payload.old.user_id === currentUserId) {
                          userHasVoted = false
                        }
                      }

                      return {
                        ...r,
                        vote_count: voteCount,
                        user_has_voted: userHasVoted,
                      }
                    }),
                  })),
                }
              }
            )
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [reportId, currentUserId, queryClient])
}
