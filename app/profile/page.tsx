import { redirect } from 'next/navigation'
import { Trophy, Award, Landmark, Eye } from 'lucide-react'

import { LogoutButton } from '@/components/auth/logout-button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

function getInitials(name?: string | null, email?: string | null) {
  const label = name || email || 'CIVIQ'
  return label
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatJoinDate(date?: string | null) {
  if (!date) {
    return 'Unavailable'
  }

  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()

  // Fetch real-time statistics for the authenticated user
  const [reportsCountRes, verificationsCountRes, reportsRes] = await Promise.all([
    supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('report_verifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('reports_with_stats')
      .select('vote_count, comment_count, verification_count, trust_score')
      .eq('user_id', user.id)
  ])

  const reportsCount = reportsCountRes.count || 0
  const verificationsCount = verificationsCountRes.count || 0
  const votesReceived = reportsRes.data?.reduce((acc, r) => acc + (r.vote_count || 0), 0) || 0
  
  // Calculate average trust score
  const totalReports = reportsRes.data?.length || 0
  const sumTrustScore = reportsRes.data?.reduce((acc, r) => acc + (r.trust_score || 0), 0) || 0
  const avgTrustScore = totalReports > 0 ? Math.round(sumTrustScore / totalReports) : 100

  // Points Formula: Reports Created * 10 + Reports Verified * 5 + Votes Received * 2
  const contributionPoints = (reportsCount * 10) + (verificationsCount * 5) + (votesReceived * 2)

  // Dynamic badge resolver
  let badgeTitle = 'Citizen Apprentice'
  let badgeIcon = Landmark
  let badgeStyle = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/25'
  
  if (contributionPoints >= 500) {
    badgeTitle = 'Honorary Mayor'
    badgeIcon = Trophy
    badgeStyle = 'bg-accent/10 text-accent border-accent/25 shadow-[0_0_12px_rgba(0,200,150,0.15)]'
  } else if (contributionPoints >= 150) {
    badgeTitle = 'Civic Guardian'
    badgeIcon = Award
    badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/25'
  } else if (contributionPoints >= 50) {
    badgeTitle = 'Active Sentinel'
    badgeIcon = Eye
    badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/25'
  }

  const BadgeIcon = badgeIcon
  const fullName = profile?.full_name || (user.user_metadata.full_name as string | undefined) || 'CIVIQ Member'
  const email = profile?.email || user.email || 'Email unavailable'
  const avatarUrl = profile?.avatar_url || (user.user_metadata.avatar_url as string | undefined)

  return (
    <section className="mx-auto max-w-4xl space-y-6 my-6 px-4">
      {/* ── Profile Header Card ── */}
      <div className="glass-panel rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-8 shadow-2xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-accent/40 shadow-md">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-xl bg-muted font-bold text-white">{getInitials(fullName, email)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">{fullName}</h1>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${badgeStyle}`}>
                  <BadgeIcon className="h-3 w-3" />
                  {badgeTitle}
                </span>
              </div>
              <p className="text-xs font-bold text-muted-foreground tracking-wide">{email}</p>
            </div>
          </div>

          <LogoutButton />
        </div>

        {/* Basic meta definitions */}
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/5 bg-white/4 p-5 space-y-1">
            <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Join date</dt>
            <dd className="text-sm font-bold text-white">{formatJoinDate(profile?.created_at || user.created_at)}</dd>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/4 p-5 space-y-1">
            <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Identity provider</dt>
            <dd className="text-sm font-bold text-white">Google OAuth</dd>
          </div>
        </dl>
      </div>

      {/* ── Dynamic Statistics Dashboard ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
        {[
          { label: 'Reports Filed', value: reportsCount, color: 'text-white' },
          { label: 'Reports Verified', value: verificationsCount, color: 'text-blue-400' },
          { label: 'Votes Received', value: votesReceived, color: 'text-amber-400' },
          { label: 'Trust Index', value: `${avgTrustScore}%`, color: 'text-accent' },
          { label: 'Civic Points', value: `${contributionPoints} pts`, color: 'text-purple-400 font-extrabold' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-5 flex flex-col justify-between border border-white/5 bg-[#0B0E13]/40 text-center">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block mb-2">{stat.label}</span>
            <span className={`text-xl font-black ${stat.color} tracking-tight tabular-nums`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {error || !profile ? (
        <Alert variant="destructive" className="rounded-2xl border-red-500/20 bg-red-500/5 text-red-400">
          <AlertTitle className="font-bold text-xs uppercase tracking-wider">Profile Status Notice</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed mt-1">
            Your authenticated session is active, but your profile could not be loaded from public.profiles. Please sign out and try again.
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
