'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Brain, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { ReportAnalysis } from '@/types/report'

interface AiPreviewCardProps {
  analysis: ReportAnalysis | null
  loading: boolean
}

const severityConfig = {
  Low: {
    label: 'Low',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  Medium: {
    label: 'Medium',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  High: {
    label: 'High',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-400',
  },
}

function ConfidenceBar({ value }: { value: number }) {
  const percent = Math.round(value * 100)

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">AI Confidence</span>
        <span
          className={cn(
            'font-semibold tabular-nums',
            percent >= 70
              ? 'text-emerald-400'
              : percent >= 40
                ? 'text-amber-400'
                : 'text-red-400',
          )}
        >
          {percent}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            'h-full rounded-full',
            percent >= 70
              ? 'bg-emerald-500'
              : percent >= 40
                ? 'bg-amber-500'
                : 'bg-red-500',
          )}
        />
      </div>
    </div>
  )
}

export function AiPreviewCard({ analysis, loading }: AiPreviewCardProps) {
  const severity = analysis ? severityConfig[analysis.severity] : null

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border bg-card/80 p-5 backdrop-blur transition-all duration-300',
        analysis ? 'border-blue-500/30' : 'border-white/10',
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15">
          <Brain className="h-4 w-4 text-blue-400" />
        </div>
        <div>
          <p className="text-sm font-semibold">AI Analysis</p>
          <p className="text-xs text-muted-foreground">Gemini Vision · gemini-2.5-flash</p>
        </div>

        {analysis && !loading && (
          <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
        )}
        {loading && (
          <Loader2 className="ml-auto h-4 w-4 animate-spin text-blue-400" />
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {[80, 60, 90, 100].map((w) => (
              <div
                key={w}
                className="h-4 animate-pulse rounded-full bg-white/10"
                style={{ width: `${w}%` }}
              />
            ))}
          </motion.div>
        ) : analysis ? (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="space-y-4"
          >
            {/* Category + Severity */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Category
                </p>
                <p className="text-sm font-semibold text-foreground">{analysis.category}</p>
              </div>

              <div className={cn('rounded-xl p-3', severity?.bg, severity?.border, 'border')}>
                <p className="mb-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Severity
                </p>
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn('h-2 w-2 rounded-full', severity?.dot)}
                    aria-hidden="true"
                  />
                  <p className={cn('text-sm font-semibold', severity?.color)}>
                    {analysis.severity}
                  </p>
                </div>
              </div>
            </div>

            {/* Confidence */}
            <ConfidenceBar value={analysis.confidence} />

            {/* Summary */}
            <div className="rounded-xl bg-white/5 p-3">
              <p className="mb-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                AI Summary
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">{analysis.summary}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-3 py-6 text-center"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
              <AlertTriangle className="h-5 w-5 text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">No analysis yet</p>
              <p className="mt-0.5 text-xs text-muted-foreground/60">
                Upload an image and submit to generate AI insights
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
