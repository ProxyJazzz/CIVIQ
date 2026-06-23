'use client'

import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, AlertCircle, Radio } from 'lucide-react'

import { FilterBar } from '@/components/feed/filter-bar'
import { ReportCard } from '@/components/feed/report-card'
import { SearchBar } from '@/components/feed/search-bar'
import { Skeleton } from '@/components/ui/skeleton'
import { useReports } from '@/hooks/use-reports'
import type { FeedFilters } from '@/types/community'

const DEFAULT_FILTERS: FeedFilters = {
  category: 'all',
  severity: 'all',
  status: 'all',
  search: '',
}

interface FeedClientProps {
  userId: string | null
}

function ReportCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/4">
      <Skeleton className="aspect-[16/9] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-4 pt-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  )
}

export function FeedClient({ userId }: FeedClientProps) {
  const [filters, setFilters] = useState<FeedFilters>(DEFAULT_FILTERS)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useReports({
    filters,
    userId: userId ?? undefined,
  })

  const reports = data?.pages.flatMap((p) => p.reports) ?? []

  // Sentinel element for infinite scroll
  const sentinelRef = useCallback(
    (el: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect()
      if (!el) return

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
            void fetchNextPage()
          }
        },
        { rootMargin: '200px' },
      )
      observerRef.current.observe(el)
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage],
  )

  function handleSearchChange(search: string) {
    setFilters((f) => ({ ...f, search }))
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <SearchBar value={filters.search} onChange={handleSearchChange} />

      {/* Filters */}
      <FilterBar filters={filters} onChange={setFilters} />

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ReportCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-20 text-center"
        >
          <AlertCircle className="h-10 w-10 text-red-400/70" />
          <p className="text-sm text-muted-foreground">Failed to load reports. Please refresh.</p>
        </motion.div>
      ) : reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3 py-20 text-center"
        >
          <Radio className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No reports match your filters.</p>
        </motion.div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((report, i) => (
              <ReportCard key={report.id} report={report} index={i} />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={sentinelRef} className="h-4" />

          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!hasNextPage && reports.length > 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              All {reports.length} reports loaded.
            </p>
          )}
        </>
      )}
    </div>
  )
}
