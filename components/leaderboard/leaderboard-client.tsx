'use client'

import { useEffect } from 'react'
import { Trophy, Award, Medal, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { getLeaderboard } from '@/lib/leaderboard/get-leaderboard'
import { createClient } from '@/lib/supabase/client'
import type { LeaderboardUser } from '@/types/community'

const MOCK_NAMES = [
  'Officer Vikram Singh',
  'Amit Sharma',
  'Priya Patel',
  'Rahul Verma',
  'Sneha Reddy'
]

function getInitials(name?: string | null) {
  if (!name) return 'CQ'
  return name
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function LeaderboardClient() {
  const supabase = createClient()

  const { data: users = [], isLoading, refetch } = useQuery<LeaderboardUser[]>({
    queryKey: ['leaderboard'],
    queryFn: getLeaderboard,
  })

  // Set up Supabase real-time subscription to auto-refresh leaderboard on client activity
  useEffect(() => {
    const channel = supabase
      .channel('realtime:leaderboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reports' },
        () => { void refetch() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'report_verifications' },
        () => { void refetch() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'votes' },
        () => { void refetch() }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, refetch])

  // 1. Filter out mock users
  const filteredUsers = users.filter((u) => !MOCK_NAMES.includes(u.full_name || ''))

  // 2. Sort according to tie-breaker requirements
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // Tie-breaker 1: Highest Score Descending
    if (b.score !== a.score) return b.score - a.score

    // Tie-breaker 2: Highest Reports Descending
    if (b.reports_count !== a.reports_count) return b.reports_count - a.reports_count

    // Tie-breaker 3: Highest Verifications Descending
    if (b.verifications_count !== a.verifications_count) return b.verifications_count - a.verifications_count

    // Tie-breaker 4: Alphabetical by Display Name
    const nameA = a.full_name || ''
    const nameB = b.full_name || ''
    return nameA.localeCompare(nameB)
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4 items-end justify-center max-w-2xl mx-auto py-8">
          <Skeleton className="h-32 w-48 rounded-3xl" />
          <Skeleton className="h-40 w-48 rounded-3xl" />
          <Skeleton className="h-28 w-48 rounded-3xl" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-10 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  if (sortedUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/8 bg-[#0B0E13]/60 rounded-3xl min-h-[350px]">
        <Users className="h-12 w-12 text-accent opacity-30 mb-3 animate-pulse" />
        <h3 className="text-base font-black text-white">No activity yet</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
          No citizens have earned ranking points yet.
        </p>
      </div>
    )
  }

  const topThree = sortedUsers.slice(0, 3)
  const podiumOrder = [
    {
      item: topThree[1],
      place: 2,
      badgeColor: 'bg-slate-300 text-slate-900 border-slate-400/20 shadow-[0_0_10px_rgba(203,213,225,0.2)]',
      icon: Medal,
      height: 'h-36 border border-white/5 bg-[#12161F]/30',
    }, // 2nd
    {
      item: topThree[0],
      place: 1,
      badgeColor: 'bg-amber-400 text-amber-950 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
      icon: Trophy,
      height: 'h-44 border-2 border-accent/40 bg-[#12161F]/60 shadow-lg shadow-accent/5',
    }, // 1st
    {
      item: topThree[2],
      place: 3,
      badgeColor: 'bg-amber-700 text-white border-amber-800/20 shadow-[0_0_10px_rgba(180,83,9,0.2)]',
      icon: Award,
      height: 'h-32 border border-white/5 bg-[#12161F]/20',
    }, // 3rd
  ]

  return (
    <div className="space-y-8">
      {/* ── Podium for Top 3 ── */}
      <div className="flex flex-col items-center justify-center sm:flex-row gap-6 pt-4 max-w-2xl mx-auto">
        {podiumOrder.map(({ item, place, badgeColor, icon: Icon, height }) => {
          if (!item) return null
          const name = item.full_name || 'Citizen'
          return (
            <div
              key={item.id}
              className={`flex flex-col items-center justify-end rounded-3xl p-6 text-center w-full sm:w-48 shadow-xl transition-all duration-300 hover:scale-[1.02] ${height}`}
            >
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-[#050608]">
                  <AvatarImage src={item.avatar_url || undefined} alt={name} />
                  <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-black ${badgeColor}`}
                >
                  {place}
                </span>
              </div>

              <div className="mt-4 w-full">
                <h3 className="font-bold text-xs truncate max-w-40 text-white">{name}</h3>
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <Icon className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-black text-accent">{item.score} pts</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Full Rankings Table ── */}
      <div className="bg-[#0B0E13]/60 rounded-3xl border border-white/8 overflow-hidden shadow-2xl shadow-black/25">
        <div className="p-6 border-b border-white/5">
          <h3 className="text-sm font-black uppercase tracking-wider text-white">Operational Ranking</h3>
          <p className="text-[10px] text-muted-foreground mt-1">
            Points formula: Reports × 10 + Verifications × 5 + Votes × 2
          </p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-white/2">
              <TableRow className="border-b border-white/5 hover:bg-transparent">
                <TableHead className="w-16 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Rank
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  User
                </TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Reports Filed
                </TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Verifications
                </TableHead>
                <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Votes Cast
                </TableHead>
                <TableHead className="text-right pr-6 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Score
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((item, index) => {
                const name = item.full_name || 'Citizen'
                return (
                  <TableRow
                    key={item.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                  >
                    <TableCell className="text-center font-black text-xs text-muted-foreground py-3.5">
                      #{index + 1}
                    </TableCell>
                    <TableCell className="flex items-center gap-3 py-3.5">
                      <Avatar className="h-8 w-8 border border-white/10 shrink-0">
                        <AvatarImage src={item.avatar_url || undefined} alt={name} />
                        <AvatarFallback className="text-[9px] bg-muted font-bold">
                          {getInitials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-xs sm:text-sm text-white">{name}</span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-white py-3.5">
                      {item.reports_count}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-white py-3.5">
                      {item.verifications_count}
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-white py-3.5">
                      {item.votes_count}
                    </TableCell>
                    <TableCell className="text-right pr-6 font-black text-xs sm:text-sm text-accent py-3.5 tabular-nums">
                      {item.score} pts
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
