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
        'relative rounded-full px-3 py-1 text-xs font-medium transition-all duration-200',
        active
          ? 'text-white'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {active && (
        <motion.span
          layoutId="filter-chip-bg"
          className="absolute inset-0 rounded-full bg-blue-600"
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        />
      )}
      <span className="relative">{children}</span>
    </button>
  )
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/8 bg-white/4 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1">
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

      <div className="flex flex-wrap gap-3">
        {/* Severity */}
        <div className="flex items-center gap-1">
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

        {/* Status */}
        <div className="flex items-center gap-1">
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
