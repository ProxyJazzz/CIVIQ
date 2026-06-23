'use client'

import { Loader2, SendHorizonal, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SubmitButtonProps {
  loading: boolean
  success: boolean
  disabled?: boolean
  className?: string
}

export function SubmitButton({ loading, success, disabled, className }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={disabled ?? loading ?? success}
      className={cn(
        'relative min-w-44 gap-2 overflow-hidden rounded-full bg-blue-600 text-sm font-semibold text-white shadow-lg shadow-blue-900/30 transition-all duration-200',
        'hover:bg-blue-500 hover:shadow-blue-800/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        success && 'bg-emerald-600 hover:bg-emerald-600',
        className,
      )}
      aria-label={loading ? 'Submitting report…' : success ? 'Report submitted' : 'Submit report'}
    >
      <motion.span
        key={loading ? 'loading' : success ? 'success' : 'idle'}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="flex items-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : success ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            Submitted!
          </>
        ) : (
          <>
            <SendHorizonal className="h-4 w-4" />
            Submit Report
          </>
        )}
      </motion.span>
    </Button>
  )
}
