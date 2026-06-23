'use client'

import { useMemo, useState } from 'react'
import { Layers, AlertCircle } from 'lucide-react'

import { MapView } from '@/components/map/map-view'
import { useReports } from '@/hooks/use-reports'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { FeedFilters, ReportSeverity } from '@/types/community'

const EMPTY_FILTERS: FeedFilters = {
  category: 'all',
  severity: 'all',
  status: 'all',
  search: '',
}

const SEVERITY_OPTIONS: Array<{ value: ReportSeverity | 'all'; label: string; color: string }> = [
  { value: 'all', label: 'All', color: 'bg-white/20' },
  { value: 'High', label: 'High', color: 'bg-red-500' },
  { value: 'Medium', label: 'Medium', color: 'bg-amber-500' },
  { value: 'Low', label: 'Low', color: 'bg-emerald-500' },
]

interface MapClientProps {
  userId: string | null
}

export function MapClient({ userId }: MapClientProps) {
  const [severity, setSeverity] = useState<ReportSeverity | 'all'>('all')

  const filters: FeedFilters = useMemo(
    () => ({ ...EMPTY_FILTERS, severity }),
    [severity],
  )

  const { data, isLoading, isError } = useReports({
    filters,
    userId: userId ?? undefined,
  })

  const reports = useMemo(() => data?.pages.flatMap((p) => p.reports) ?? [], [data])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/8 bg-white/4 p-3 backdrop-blur">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Layers className="h-3.5 w-3.5" />
          <span className="font-semibold uppercase tracking-widest">Severity</span>
        </div>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all',
                severity === opt.value
                  ? 'bg-white/15 text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className={cn('h-2 w-2 rounded-full', opt.color)} />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{reports.length}</span> issue
          {reports.length !== 1 ? 's' : ''} on map
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {[
          { label: 'High Severity', color: 'bg-red-500' },
          { label: 'Medium Severity', color: 'bg-amber-500' },
          { label: 'Low Severity', color: 'bg-emerald-500' },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={cn('h-2.5 w-2.5 rounded-full ring-2 ring-white/20', l.color)} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Map container */}
      {isLoading ? (
        <Skeleton className="h-[70vh] w-full rounded-2xl" />
      ) : isError ? (
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/4">
          <AlertCircle className="h-8 w-8 text-red-400/70" />
          <p className="text-sm text-muted-foreground">Failed to load map data.</p>
        </div>
      ) : (
        <div className="h-[70vh] w-full">
          <MapView reports={reports} />
        </div>
      )}
    </div>
  )
}
