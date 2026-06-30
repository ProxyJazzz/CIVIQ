'use client'

import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

import type { ActivePresence } from '@/types/community'

interface OnlineUsersWidgetProps {
  onlineUsers: ActivePresence[]
  currentUserId: string | null
}

export function OnlineUsersWidget({ onlineUsers, currentUserId }: OnlineUsersWidgetProps) {
  const sortedUsers = [...onlineUsers].sort((a, b) => {
    if (a.user_id === currentUserId) return -1
    if (b.user_id === currentUserId) return 1
    if (a.status === 'online' && b.status === 'away') return -1
    if (a.status === 'away' && b.status === 'online') return 1
    return (a.full_name || '').localeCompare(b.full_name || '')
  })

  return (
    <div className="rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-5 space-y-4 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-black tracking-tight text-white">Active Citizens</h2>
        </div>
        <span className="flex h-5 items-center rounded-full bg-accent/10 px-2.5 text-[9px] font-bold uppercase tracking-wide text-accent border border-accent/20">
          {onlineUsers.length} Online
        </span>
      </div>

      <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 no-scrollbar">
        {sortedUsers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No active citizens.</p>
        ) : (
          sortedUsers.map((user) => {
            const isMe = user.user_id === currentUserId
            const isOnline = user.status === 'online'

            return (
              <motion.div
                key={user.user_id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/5 transition-all duration-200"
              >
                <div className="relative shrink-0">
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Citizen'}
                      className="h-8 w-8 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white border border-white/10 uppercase">
                      {(user.full_name || 'C')[0]}
                    </div>
                  )}

                  <span
                    className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[#0B0E13] ${
                      isOnline ? 'bg-accent glow-accent' : 'bg-amber-500'
                    }`}
                    title={isOnline ? 'Online' : 'Away'}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold truncate text-white leading-tight">
                      {user.full_name || 'Anonymous Citizen'}
                    </p>
                    {isMe && (
                      <span className="text-[8px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground capitalize mt-0.5">
                    {user.status === 'online' ? 'Active now' : 'Away'}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
