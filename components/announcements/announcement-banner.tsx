'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertOctagon, AlertTriangle, Info, X } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import type { Announcement } from '@/types/community'

export function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const supabase = createClient()

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const now = new Date().toISOString()
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false })

      if (data) {
        setAnnouncements(data)
      }
    }

    void fetchAnnouncements()

    const channel = supabase
      .channel('realtime:announcements')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          const newAnn = payload.new as Announcement
          if (!newAnn.expires_at || new Date(newAnn.expires_at) > new Date()) {
            setAnnouncements((prev) => [newAnn, ...prev])
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'announcements' },
        (payload) => {
          setAnnouncements((prev) => prev.filter((a) => a.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  const activeAnnouncements = announcements.filter((a) => !dismissedIds.has(a.id))

  if (activeAnnouncements.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  return (
    <div className="w-full flex flex-col gap-1 z-50">
      <AnimatePresence initial={false}>
        {activeAnnouncements.map((ann) => {
          const isEmergency = ann.severity === 'Emergency'
          const isWarning = ann.severity === 'Warning'

          const bannerBg = isEmergency
            ? 'bg-red-500/15 border-red-500/30 text-red-200'
            : isWarning
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
              : 'bg-zinc-800 border-zinc-700 text-zinc-200'

          const pulseRing = isEmergency
            ? 'bg-red-500'
            : isWarning
              ? 'bg-amber-500'
              : 'bg-zinc-400'

          const Icon = isEmergency
            ? AlertOctagon
            : isWarning
              ? AlertTriangle
              : Info

          return (
            <motion.div
              key={ann.id}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div
                className={`flex items-center justify-between border-b px-4 py-2.5 text-xs sm:text-sm font-medium ${bannerBg}`}
                role="alert"
              >
                <div className="flex items-center gap-2.5 flex-1 mr-4">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseRing}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseRing}`} />
                  </span>
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  <span className="leading-normal">
                    <strong className="font-semibold mr-1.5">{ann.title}:</strong>
                    {ann.content}
                  </span>
                </div>
                <button
                  onClick={() => handleDismiss(ann.id)}
                  className="rounded p-1 hover:bg-white/15 transition-colors shrink-0 text-current opacity-80 hover:opacity-100"
                  aria-label="Dismiss announcement"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
