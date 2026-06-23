'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import { ThumbsUp, MessageSquare, ShieldCheck, ArrowRight, MapPin } from 'lucide-react'

import { Badge } from '@/components/shared/badge'
import { calculateTrustScore } from '@/lib/trust-score/calculate-trust-score'
import { cn } from '@/lib/utils'
import type { ReportWithStats } from '@/types/community'

interface ReportCardProps {
  report: ReportWithStats
  index?: number
}

function getSeverityVariant(severity: string) {
  if (severity === 'High') return 'severity-high' as const
  if (severity === 'Medium') return 'severity-medium' as const
  return 'severity-low' as const
}

function getStatusVariant(status: string) {
  if (status === 'resolved') return 'status-resolved' as const
  if (status === 'in_progress') return 'status-in_progress' as const
  return 'status-pending' as const
}

function formatStatus(status: string) {
  if (status === 'in_progress') return 'In Progress'
  if (status === 'resolved') return 'Resolved'
  return 'Pending'
}

export function ReportCard({ report, index = 0 }: ReportCardProps) {
  const trust = calculateTrustScore({
    verifications: report.verification_count,
    votes: report.vote_count,
    comments: report.comment_count,
    createdAt: report.created_at,
  })

  const trustColor =
    trust.label === 'High Trust'
      ? 'text-emerald-400'
      : trust.label === 'Medium Trust'
        ? 'text-amber-400'
        : 'text-red-400/70'

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/4 backdrop-blur transition-all duration-300 hover:border-white/15 hover:bg-white/6 hover:shadow-xl hover:shadow-black/20"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={report.image_url}
          alt={report.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant={getSeverityVariant(report.severity)}>{report.severity}</Badge>
          <Badge variant="category">{report.category}</Badge>
        </div>

        {/* Status bottom-right */}
        <div className="absolute bottom-3 right-3">
          <Badge variant={getStatusVariant(report.status)}>{formatStatus(report.status)}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="line-clamp-1 text-base font-semibold leading-snug">{report.title}</h3>
          {report.summary && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.summary}</p>
          )}
        </div>

        {/* Location + time */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground/70">
          <MapPin className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{report.address}</span>
          <span className="mx-1">·</span>
          <span className="flex-shrink-0">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between border-t border-white/8 pt-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className={cn('flex items-center gap-1', report.user_has_voted && 'text-blue-400')}>
              <ThumbsUp className="h-3.5 w-3.5" />
              {report.vote_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {report.comment_count}
            </span>
            <span className={cn('flex items-center gap-1', report.user_has_verified && 'text-emerald-400')}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {report.verification_count}
            </span>
            <span className={cn('text-[11px] font-medium', trustColor)}>{trust.label}</span>
          </div>

          <Link
            href={`/report/${report.id}`}
            className="flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-blue-500/20 hover:text-blue-300"
            aria-label={`View details for ${report.title}`}
          >
            Details
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
