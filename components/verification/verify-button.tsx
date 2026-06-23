'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

import { useVerifications } from '@/hooks/use-verifications'
import { cn } from '@/lib/utils'

interface VerifyButtonProps {
  reportId: string
  userId: string | null
  initialCount: number
  initialVerified: boolean
}

export function VerifyButton({
  reportId,
  userId,
  initialCount,
  initialVerified,
}: VerifyButtonProps) {
  const { verify, isPending } = useVerifications({ reportId, userId })

  return (
    <button
      type="button"
      onClick={verify}
      disabled={isPending || !userId}
      aria-label={initialVerified ? 'Remove verification' : 'I am experiencing this too'}
      aria-pressed={initialVerified}
      className={cn(
        'group flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all duration-200',
        initialVerified
          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
          : 'border-white/10 bg-white/5 text-muted-foreground hover:border-white/20 hover:text-foreground',
        isPending && 'cursor-wait opacity-70',
        !userId && 'cursor-not-allowed opacity-50',
      )}
    >
      <ShieldCheck
        className={cn(
          'h-4 w-4 transition-transform duration-200',
          initialVerified && 'fill-emerald-400/30 text-emerald-400',
        )}
      />
      <span className="flex flex-col items-start">
        <span className="text-xs leading-none">
          {initialVerified ? 'Verified' : 'I have this issue'}
        </span>
        <AnimatePresence mode="wait">
          <motion.span
            key={initialCount}
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 3 }}
            transition={{ duration: 0.15 }}
            className="text-[10px] tabular-nums text-muted-foreground"
          >
            {initialCount} {initialCount === 1 ? 'person' : 'people'}
          </motion.span>
        </AnimatePresence>
      </span>
    </button>
  )
}
