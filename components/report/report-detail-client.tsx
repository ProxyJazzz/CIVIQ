'use client'

import Image from 'next/image'
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
import { useComments } from '@/hooks/use-comments'
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

  const { comments, isLoading: commentsLoading, addComment, editComment, removeComment } =
    useComments(reportId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="aspect-[21/9] w-full rounded-2xl" />
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
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <ShieldAlert className="h-10 w-10 text-red-400/70" />
        <p className="text-muted-foreground">Report not found or access denied.</p>
        <Link href="/feed" className="text-sm text-blue-400 underline underline-offset-4">
          Back to feed
        </Link>
      </div>
    )
  }

  const trust = calculateTrustScore({
    verifications: report.verification_count,
    votes: report.vote_count,
    createdAt: report.created_at,
  })

  const trustColor =
    trust.label === 'High Trust'
      ? 'text-emerald-400'
      : trust.label === 'Medium Trust'
        ? 'text-amber-400'
        : 'text-red-400/70'

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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-8"
    >
      {/* Back */}
      <Link
        href="/feed"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to feed
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* ─── Left column ─────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Hero image */}
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={report.image_url}
              alt={report.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 65vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
              <Badge variant={getSeverityVariant(report.severity)}>{report.severity} Severity</Badge>
              <Badge variant={getStatusVariant(report.status)}>{formatStatus(report.status)}</Badge>
              <Badge variant="category">{report.category}</Badge>
            </div>
          </div>

          {/* Title + description */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold leading-snug">{report.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{report.description}</p>
          </div>

          {/* Location + date */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {report.address}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {format(new Date(report.created_at), 'PPP')} &middot;{' '}
              {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
            </span>
          </div>

          {/* Action row */}
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

          {/* Comments */}
          <div
            className="rounded-2xl border border-white/8 bg-white/4 p-5 space-y-5"
            id="comments"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-base font-semibold">
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

        {/* ─── Right sidebar ───────────────────────────────────── */}
        <div className="space-y-4">
          {/* AI Analysis */}
          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-400" />
              <h2 className="text-sm font-semibold">AI Analysis</h2>
            </div>

            {report.summary && (
              <p className="text-sm text-foreground/90 leading-relaxed">{report.summary}</p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span className="font-semibold tabular-nums text-blue-300">
                  {Math.round(report.confidence * 100)}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${report.confidence * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Trust Score */}
          <div className="rounded-2xl border border-white/8 bg-white/4 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold">Community Trust</h2>
            </div>

            <div className="text-center py-2">
              <div className={cn('text-3xl font-bold tabular-nums', trustColor)}>
                {trust.score}
              </div>
              <div className={cn('text-sm font-medium mt-0.5', trustColor)}>{trust.label}</div>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Votes', value: report.vote_count, weight: '0.3×' },
                { label: 'Verifications', value: report.verification_count, weight: '0.5×' },
                { label: 'Comments', value: report.comment_count, weight: '' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between text-muted-foreground">
                  <span>{stat.label}</span>
                  <span className="font-medium text-foreground">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Coordinates */}
          <div className="rounded-2xl border border-white/8 bg-white/4 p-5 space-y-2">
            <h2 className="text-sm font-semibold">Location</h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-white/5 p-2.5">
                <p className="text-muted-foreground mb-1">Latitude</p>
                <p className="font-mono font-medium">{report.latitude.toFixed(5)}</p>
              </div>
              <div className="rounded-lg bg-white/5 p-2.5">
                <p className="text-muted-foreground mb-1">Longitude</p>
                <p className="font-mono font-medium">{report.longitude.toFixed(5)}</p>
              </div>
            </div>
            <Link
              href={`/map?lat=${report.latitude}&lng=${report.longitude}`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 hover:underline"
            >
              <MapPin className="h-3 w-3" />
              View on map
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
