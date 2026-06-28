'use client'

import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'
import { REPORTS_QUERY_KEY } from '@/hooks/use-reports'
import type { FeedPage, ReportWithStats } from '@/types/community'

export function useRealtimeVerifications(reportId: string, currentUserId: string | null) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`realtime:verifications:${reportId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_verifications',
          filter: `report_id=eq.${reportId}`,
        },
        async (payload) => {
          // Fetch updated verification count from the stats view
          const { data } = await supabase
            .from('reports_with_stats')
            .select('verification_count')
            .eq('id', reportId)
            .single()

          const verificationCount = data?.verification_count

          if (verificationCount !== undefined && verificationCount !== null) {
            // 1. Update report detail cache
            queryClient.setQueriesData<ReportWithStats>(
              { queryKey: ['report', reportId] },
              (oldReport) => {
                if (!oldReport) return oldReport

                let userHasVerified = oldReport.user_has_verified
                if (currentUserId) {
                  if (payload.eventType === 'INSERT' && payload.new.user_id === currentUserId) {
                    userHasVerified = true
                  } else if (payload.eventType === 'DELETE' && payload.old.user_id === currentUserId) {
                    userHasVerified = false
                  }
                }

                return {
                  ...oldReport,
                  verification_count: verificationCount,
                  user_has_verified: userHasVerified,
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

                      let userHasVerified = r.user_has_verified
                      if (currentUserId) {
                        if (payload.eventType === 'INSERT' && payload.new.user_id === currentUserId) {
                          userHasVerified = true
                        } else if (payload.eventType === 'DELETE' && payload.old.user_id === currentUserId) {
                          userHasVerified = false
                        }
                      }

                      return {
                        ...r,
                        verification_count: verificationCount,
                        user_has_verified: userHasVerified,
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
  }, [reportId, currentUserId, queryClient, supabase])
}
