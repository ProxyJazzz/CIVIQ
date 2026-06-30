'use client'

import Link from 'next/link'
import { SafeImage } from '@/components/shared/safe-image'
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
 
  // Trust label mapping to styling
  const trustBadgeStyles =
    trust.label === 'High Trust'
      ? 'bg-accent/10 text-accent border-accent/20'
      : trust.label === 'Medium Trust'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        : 'bg-red-500/10 text-red-400 border-red-500/20'
 
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-white/8 bg-[#0B0E13]/60 hover:border-white/15 hover:bg-[#12161F]/60 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50"
    >
      {/* Visual Cover */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <SafeImage
          src={report.image_url}
          alt={report.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          priority={index < 2}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/90 via-[#050608]/20 to-transparent" />

        {/* Top Floating Badges */}
        <div className="absolute left-4 top-4 flex flex-wrap gap-1.5 z-10">
          <Badge variant={getSeverityVariant(report.severity)} className="font-bold text-[10px] uppercase">{report.severity}</Badge>
          <Badge variant="category" className="font-bold text-[10px] uppercase bg-[#0B0E13]/80 backdrop-blur-md">{report.category}</Badge>
        </div>

        {/* Status Bottom-Right */}
        <div className="absolute bottom-4 right-4 z-10">
          <Badge variant={getStatusVariant(report.status)} className="font-bold text-[10px] uppercase shadow-md">{formatStatus(report.status)}</Badge>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-base font-black tracking-tight text-white group-hover:text-accent transition-colors duration-200">
            {report.title}
          </h3>
          {report.summary && (
            <p className="line-clamp-2 text-xs text-[#A0AEC0] leading-relaxed">
              {report.summary}
            </p>
          )}
        </div>

        {/* Geographic Coordination & Age */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-accent/80" />
          <span className="truncate max-w-[65%] font-medium">{report.address}</span>
          <span className="text-white/20">·</span>
          <span className="flex-shrink-0 font-medium">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
          </span>
        </div>

        {/* Action & Metrics footer */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
          <div className="flex items-center gap-3">
            <span className={cn('flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors', report.user_has_voted && 'text-blue-400 font-bold')}>
              <ThumbsUp className={cn("h-3.5 w-3.5", report.user_has_voted && "fill-blue-500/25")} />
              {report.vote_count}
            </span>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              {report.comment_count}
            </span>
            <span className={cn('flex items-center gap-1 text-[11px] font-semibold text-muted-foreground transition-colors', report.user_has_verified && 'text-accent font-bold')}>
              <ShieldCheck className={cn("h-3.5 w-3.5", report.user_has_verified && "fill-accent/25")} />
              {report.verification_count}
            </span>
            
            {/* Trust Indicator Badge */}
            <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide', trustBadgeStyles)}>
              {trust.label}
            </span>
          </div>

          <Link
            href={`/report/${report.id}`}
            className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs font-bold text-white transition-all duration-200 hover:bg-accent hover:border-accent hover:text-accent-foreground hover:scale-[1.02]"
            aria-label={`View details for ${report.title}`}
          >
            Details
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </motion.article>
  )
}
