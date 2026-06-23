'use client'

import { useInfiniteQuery } from '@tanstack/react-query'

import { getReports } from '@/lib/reports/get-reports'
import type { FeedFilters, FeedPage } from '@/types/community'

export const REPORTS_QUERY_KEY = 'reports'

interface UseReportsOptions {
  filters: FeedFilters
  userId?: string
}

export function useReports({ filters, userId }: UseReportsOptions) {
  return useInfiniteQuery<FeedPage, Error>({
    queryKey: [REPORTS_QUERY_KEY, filters, userId],
    queryFn: ({ pageParam }) =>
      getReports({
        filters,
        cursor: pageParam as string | undefined,
        userId,
      }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}
