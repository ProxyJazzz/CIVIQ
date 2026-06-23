'use client'

import { useEffect } from 'react'
import { useQueryClient, type InfiniteData } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'
import { useReports, REPORTS_QUERY_KEY } from '@/hooks/use-reports'
import type { FeedFilters, ReportWithStats, FeedPage } from '@/types/community'

interface UseRealtimeFeedOptions {
  filters: FeedFilters
  userId?: string
}

export function useRealtimeFeed({ filters, userId }: UseRealtimeFeedOptions) {
  const queryClient = useQueryClient()
  const queryResult = useReports({ filters, userId })
  const supabase = createClient()

  useEffect(() => {
    const queryKey = [REPORTS_QUERY_KEY, filters, userId]

    const channel = supabase
      .channel('realtime:reports')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: enrichedReport } = await supabase
              .from('reports_with_stats')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (enrichedReport) {
              let user_has_voted = false
              let user_has_verified = false

              if (userId) {
                const [voteCheck, verifyCheck] = await Promise.all([
                  supabase
                    .from('votes')
                    .select('id')
                    .eq('report_id', payload.new.id)
                    .eq('user_id', userId)
                    .maybeSingle(),
                  supabase
                    .from('report_verifications')
                    .select('id')
                    .eq('report_id', payload.new.id)
                    .eq('user_id', userId)
                    .maybeSingle(),
                ])
                user_has_voted = !!voteCheck.data
                user_has_verified = !!verifyCheck.data
              }

              const finalReport: ReportWithStats = {
                ...enrichedReport,
                user_has_voted,
                user_has_verified,
              }

              queryClient.setQueryData<InfiniteData<FeedPage>>(queryKey, (old) => {
                if (!old) return old
                const newPages = [...old.pages]
                if (newPages.length === 0) {
                  newPages.push({ reports: [finalReport], nextCursor: null })
                } else {
                  newPages[0] = {
                    ...newPages[0],
                    reports: [finalReport, ...newPages[0].reports],
                  }
                }
                return { ...old, pages: newPages }
              })
            }
          } else if (payload.eventType === 'UPDATE') {
            const { data: enrichedReport } = await supabase
              .from('reports_with_stats')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (enrichedReport) {
              let user_has_voted = false
              let user_has_verified = false

              if (userId) {
                const [voteCheck, verifyCheck] = await Promise.all([
                  supabase
                    .from('votes')
                    .select('id')
                    .eq('report_id', payload.new.id)
                    .eq('user_id', userId)
                    .maybeSingle(),
                  supabase
                    .from('report_verifications')
                    .select('id')
                    .eq('report_id', payload.new.id)
                    .eq('user_id', userId)
                    .maybeSingle(),
                ])
                user_has_voted = !!voteCheck.data
                user_has_verified = !!verifyCheck.data
              }

              const finalReport: ReportWithStats = {
                ...enrichedReport,
                user_has_voted,
                user_has_verified,
              }

              queryClient.setQueryData<InfiniteData<FeedPage>>(queryKey, (old) => {
                if (!old) return old
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    reports: page.reports.map((r) =>
                      r.id === finalReport.id ? finalReport : r
                    ),
                  })),
                }
              })
            }
          } else if (payload.eventType === 'DELETE') {
            const reportId = payload.old.id
            queryClient.setQueryData<InfiniteData<FeedPage>>(queryKey, (old) => {
              if (!old) return old
              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  reports: page.reports.filter((r) => r.id !== reportId),
                })),
              }
            })
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [filters, userId, queryClient, supabase])

  return queryResult
}
