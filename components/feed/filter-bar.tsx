'use client'

import { motion } from 'framer-motion'
import { SlidersHorizontal } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { FeedFilters, ReportCategory, ReportSeverity, ReportStatus } from '@/types/community'

interface FilterBarProps {
  filters: FeedFilters
  onChange: (filters: FeedFilters) => void
}

const CATEGORIES: Array<{ value: ReportCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'Pothole', label: 'Pothole' },
  { value: 'Garbage', label: 'Garbage' },
  { value: 'Water Leakage', label: 'Water' },
  { value: 'Streetlight', label: 'Streetlight' },
  { value: 'Road Damage', label: 'Road' },
  { value: 'Drainage', label: 'Drainage' },
  { value: 'Other', label: 'Other' },
]

const SEVERITIES: Array<{ value: ReportSeverity | 'all'; label: string }> = [
  { value: 'all', label: 'All Severity' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
]

const STATUSES: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
]

const SORTS: Array<{ value: 'newest' | 'trending' | 'trust'; label: string }> = [
  { value: 'newest', label: 'Newest' },
  { value: 'trending', label: 'Trending' },
  { value: 'trust', label: 'Top Rated' },
]

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'relative rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200',
        active ? 'text-accent-foreground font-bold' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {active && (
        <motion.span
          layoutId="filter-chip-bg"
          className="absolute inset-0 rounded-full bg-accent"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  )
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-white/8 bg-white/4 p-5 backdrop-blur shadow-xl shadow-black/10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filter & Sort Feed
        </div>

        {/* Sort Pill Selector */}
        <div className="flex items-center gap-0.5 bg-white/5 rounded-full p-0.5 border border-white/5 self-start">
          {SORTS.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onChange({ ...filters, sortBy: s.value })}
              className={cn(
                'rounded-full px-3.5 py-1 text-[9px] font-bold tracking-wider uppercase transition-all duration-200',
                filters.sortBy === s.value ? 'bg-accent text-accent-foreground shadow' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5 border-t border-white/5 pt-3.5">
        {CATEGORIES.map((c) => (
          <Chip
            key={c.value}
            active={filters.category === c.value}
            onClick={() => onChange({ ...filters, category: c.value })}
          >
            {c.label}
          </Chip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1.5">
        {/* Severity */}
        <div className="flex flex-wrap items-center gap-1.5">
          {SEVERITIES.map((s) => (
            <Chip
              key={s.value}
              active={filters.severity === s.value}
              onClick={() => onChange({ ...filters, severity: s.value })}
            >
              {s.label}
            </Chip>
          ))}
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-4 w-px bg-white/10" />

        {/* Status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUSES.map((s) => (
            <Chip
              key={s.value}
              active={filters.status === s.value}
              onClick={() => onChange({ ...filters, status: s.value })}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </div>
    </div>
  )
}
