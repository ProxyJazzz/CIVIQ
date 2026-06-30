'use client'

import { useEffect, useMemo, useState } from 'react'
import { Layers, AlertCircle } from 'lucide-react'

import dynamic from 'next/dynamic'

const MapView = dynamic(
  () => import('@/components/map/map-view').then((mod) => mod.MapView),
  { ssr: false }
)
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed'
import { detectHotspots, type Hotspot } from '@/lib/realtime/detect-hotspots'
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
  const [hotspots, setHotspots] = useState<Hotspot[]>([])

  const filters: FeedFilters = useMemo(
    () => ({ ...EMPTY_FILTERS, severity }),
    [severity],
  )

  const { data, isLoading, isError } = useRealtimeFeed({
    filters,
    userId: userId ?? undefined,
  })

  const reports = useMemo(() => data?.pages.flatMap((p) => p.reports) ?? [], [data])

  useEffect(() => {
    async function loadHotspots() {
      try {
        const hs = await detectHotspots()
        setHotspots(hs)
      } catch (err) {
        console.error('Failed to load hotspots', err)
      }
    }
    void loadHotspots()
  }, [reports])

  return (
    <div className="relative h-[calc(100vh-13rem)] min-h-[500px] w-full rounded-3xl overflow-hidden shadow-2xl">
      {/* Floating Controls console */}
      <div className="absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2 glass-panel p-1.5 rounded-full shadow-2xl border border-white/8">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground border-r border-white/10">
          <Layers className="h-3.5 w-3.5 text-accent" />
          Severity
        </div>
        <div className="flex gap-1">
          {SEVERITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSeverity(opt.value)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-wider transition-all duration-200 border border-transparent',
                severity === opt.value
                  ? 'bg-accent text-accent-foreground font-black'
                  : 'text-muted-foreground hover:text-white hover:bg-white/5',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', opt.color === 'bg-white/20' ? 'bg-white/40' : opt.color)} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Floating Counter Display */}
      <div className="absolute right-4 bottom-4 z-20 glass-panel px-3.5 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-wider text-white border border-white/8 shadow-2xl">
        <span className="text-accent">{reports.length}</span> cases mapped
      </div>

      {/* Map viewport */}
      {isLoading ? (
        <Skeleton className="h-full w-full rounded-3xl" />
      ) : isError ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-3xl border border-white/8 bg-[#0B0E13]/60">
          <AlertCircle className="h-8 w-8 text-red-500/70 animate-pulse" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Failed to initialize GIS map</p>
        </div>
      ) : (
        <div className="h-full w-full">
          <MapView reports={reports} hotspots={hotspots} />
        </div>
      )}
    </div>
  )
}
