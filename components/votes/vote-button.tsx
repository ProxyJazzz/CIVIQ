'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ThumbsUp } from 'lucide-react'

import { useVotes } from '@/hooks/use-votes'
import { cn } from '@/lib/utils'

interface VoteButtonProps {
  reportId: string
  userId: string | null
  initialCount: number
  initialVoted: boolean
}

export function VoteButton({ reportId, userId, initialCount, initialVoted }: VoteButtonProps) {
  const { vote, isPending } = useVotes({ reportId, userId })

  return (
    <button
      type="button"
      onClick={vote}
      disabled={isPending || !userId}
      aria-label={initialVoted ? 'Remove vote' : 'Upvote this report'}
      aria-pressed={initialVoted}
      className={cn(
        'group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
        initialVoted
          ? 'border-blue-500/50 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
          : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground',
        isPending && 'cursor-wait opacity-70',
        !userId && 'cursor-not-allowed opacity-50',
      )}
    >
      <ThumbsUp
        className={cn('h-4 w-4 transition-transform duration-200', initialVoted && 'fill-blue-400')}
      />
      <AnimatePresence mode="wait">
        <motion.span
          key={initialCount}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="tabular-nums"
        >
          {initialCount}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
