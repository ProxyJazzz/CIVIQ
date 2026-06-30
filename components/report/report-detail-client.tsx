'use client'

import { SafeImage } from '@/components/shared/safe-image'
import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Brain,
  Users,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '@/components/shared/badge'
import { CommentBox } from '@/components/comments/comment-box'
import { CommentList } from '@/components/comments/comment-list'
import { VoteButton } from '@/components/votes/vote-button'
import { VerifyButton } from '@/components/verification/verify-button'
import { Skeleton } from '@/components/ui/skeleton'
import { useRealtimeComments } from '@/hooks/useRealtimeComments'
import { useRealtimeVotes } from '@/hooks/useRealtimeVotes'
import { useRealtimeVerifications } from '@/hooks/useRealtimeVerifications'
import { getReport } from '@/lib/reports/get-report'
import { calculateTrustScore } from '@/lib/trust-score/calculate-trust-score'
import { cn } from '@/lib/utils'

interface ReportDetailClientProps {
  reportId: string
  userId: string | null
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

export function ReportDetailClient({ reportId, userId }: ReportDetailClientProps) {
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', reportId, userId],
    queryFn: () => getReport(reportId, userId ?? undefined),
  })

  useRealtimeVotes(reportId, userId)
  useRealtimeVerifications(reportId, userId)

  const { comments, isLoading: commentsLoading, addComment, editComment, removeComment } =
    useRealtimeComments(reportId)

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="aspect-[21/9] w-full rounded-3xl" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    )
  }

  if (isError || !report) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center max-w-6xl mx-auto px-4 py-8">
        <ShieldAlert className="h-10 w-10 text-red-400/70 animate-pulse" />
        <p className="text-sm font-bold text-[#A0AEC0]">Report not found or access denied.</p>
        <Link href="/feed" className="text-xs text-accent font-bold hover:underline underline-offset-4">
          Back to feed
        </Link>
      </div>
    )
  }

  const trust = calculateTrustScore({
    verifications: report.verification_count,
    votes: report.vote_count,
    comments: report.comment_count,
    createdAt: report.created_at,
  })

  const trustColor =
    trust.label === 'High Trust'
      ? 'text-accent'
      : trust.label === 'Medium Trust'
        ? 'text-amber-400'
        : 'text-red-400/70'

  const trustBadgeStyles =
    trust.label === 'High Trust'
      ? 'bg-accent/10 text-accent border-accent/25'
      : trust.label === 'Medium Trust'
        ? 'bg-amber-500/10 text-amber-400 border-amber-500/25'
        : 'bg-red-500/10 text-red-400 border-red-500/25'

  async function handleAddComment(content: string) {
    if (!userId) return
    await addComment.mutateAsync({ userId, content })
  }

  async function handleEditComment(commentId: string, content: string) {
    if (!userId) return
    await editComment.mutateAsync({ commentId, userId, content })
  }

  async function handleDeleteComment(commentId: string) {
    if (!userId) return
    await removeComment.mutateAsync({ commentId, userId })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 max-w-6xl mx-auto px-4 py-6"
    >
      {/* Back button */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-white transition-colors duration-200"
      >
        <ArrowLeft className="h-4 w-4 text-accent" />
        Back to feed
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* ─── Left Column ──────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Main Hero Image */}
          <div className="relative aspect-[16/10] sm:aspect-[21/9] overflow-hidden rounded-3xl border border-white/8 bg-[#0B0E13]">
            <SafeImage
              src={report.image_url}
              alt={report.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 65vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050608]/90 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 flex flex-wrap gap-2">
              <Badge variant={getSeverityVariant(report.severity)} className="font-bold text-[10px] uppercase">{report.severity} Severity</Badge>
              <Badge variant={getStatusVariant(report.status)} className="font-bold text-[10px] uppercase shadow-md">{formatStatus(report.status)}</Badge>
              <Badge variant="category" className="font-bold text-[10px] uppercase bg-[#0B0E13]/80 backdrop-blur-md">{report.category}</Badge>
            </div>
          </div>

          {/* Incident Headers */}
          <div className="space-y-3 glass-card rounded-3xl p-6 border border-white/5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white leading-tight">
              {report.title}
            </h1>
            <p className="text-xs md:text-sm text-[#A0AEC0] leading-relaxed">
              {report.description}
            </p>

            {/* Geolocation metadata */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 pt-3 border-t border-white/5 text-[11px] font-bold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-accent" />
                {report.address}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-accent" />
                {format(new Date(report.created_at), 'PPP')} &middot;{' '}
                {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Engagement interaction triggers */}
          <div className="flex flex-wrap gap-3">
            <VoteButton
              reportId={report.id}
              userId={userId}
              initialCount={report.vote_count}
              initialVoted={report.user_has_voted}
            />
            <VerifyButton
              reportId={report.id}
              userId={userId}
              initialCount={report.verification_count}
              initialVerified={report.user_has_verified}
            />
          </div>

          {/* Real-time Comments Box */}
          <div
            className="rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 space-y-6 shadow-xl shadow-black/20"
            id="comments"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-black tracking-tight text-white">
                {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
              </h2>
            </div>

            <CommentBox userId={userId} onSubmit={handleAddComment} />

            <CommentList
              comments={comments}
              currentUserId={userId}
              onEdit={handleEditComment}
              onDelete={handleDeleteComment}
              isLoading={commentsLoading}
            />
          </div>
        </div>

        {/* ─── Right Sidebar ────────────────────────────────────── */}
        <div className="space-y-4">
          {/* AI Analysis Diagnostic */}
          <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4 shadow-lg shadow-blue-500/5 hover:border-blue-500/35 transition-colors duration-300">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <h2 className="text-xs font-black tracking-wider uppercase text-blue-300">AI Analysis</h2>
            </div>

            {report.summary && (
              <p className="text-[11px] text-[#A0AEC0] leading-relaxed font-medium">{report.summary}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold text-blue-400 uppercase tracking-wide">
                <span>Confidence score</span>
                <span className="tabular-nums font-mono">
                  {Math.round(report.confidence * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500 glow-blue transition-all duration-500"
                  style={{ width: `${report.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Community Trust Meter */}
          <div className="rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-5 space-y-4 shadow-xl shadow-black/20">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-black tracking-wider uppercase text-white">Trust Metrics</h2>
            </div>

            <div className="text-center py-2 flex flex-col items-center">
              <div className={cn('text-3xl font-black tracking-tighter tabular-nums leading-none', trustColor)}>
                {trust.score}
              </div>
              <div className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider mt-2.5', trustBadgeStyles)}>
                {trust.label}
              </div>
            </div>

            <div className="space-y-2 text-[10px] font-bold uppercase tracking-wider pt-2 border-t border-white/5">
              {[
                { label: 'Votes', value: report.vote_count, weight: '0.2×' },
                { label: 'Verifications', value: report.verification_count, weight: '0.5×' },
                { label: 'Comments', value: report.comment_count, weight: '0.1×' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between text-muted-foreground">
                  <span>{stat.label} <span className="text-[8px] text-muted-foreground/60">({stat.weight})</span></span>
                  <span className="font-mono text-white text-xs">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coordinates Details */}
          <div className="rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-5 space-y-4 shadow-xl shadow-black/20">
            <h2 className="text-xs font-black tracking-wider uppercase text-white">Incident GPS Coordinates</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Latitude</p>
                <p className="font-mono font-bold text-white text-[11px]">{report.latitude.toFixed(5)}</p>
              </div>
              <div className="rounded-2xl bg-white/5 border border-white/5 p-3">
                <p className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Longitude</p>
                <p className="font-mono font-bold text-white text-[11px]">{report.longitude.toFixed(5)}</p>
              </div>
            </div>
            
            <Link
              href={`/map?lat=${report.latitude}&lng=${report.longitude}`}
              className="w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-white/5 border border-white/10 py-2 text-xs font-bold text-white transition-all hover:bg-white/10 hover:border-white/20 mt-1"
            >
              <MapPin className="h-3.5 w-3.5 text-accent" />
              View on Map
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
