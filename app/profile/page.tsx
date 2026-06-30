import { redirect } from 'next/navigation'

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

  const fullName = profile?.full_name || (user.user_metadata.full_name as string | undefined) || 'CIVIQ Member'
  const email = profile?.email || user.email || 'Email unavailable'
  const avatarUrl = profile?.avatar_url || (user.user_metadata.avatar_url as string | undefined)

  return (
    <section className="mx-auto max-w-3xl space-y-6 my-6 px-4">
      <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-8 shadow-2xl">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-[#050608] shadow-md">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-xl bg-muted font-bold">{getInitials(fullName, email)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">{fullName}</h1>
              <p className="text-xs font-bold text-muted-foreground tracking-wide">{email}</p>
            </div>
          </div>

          <LogoutButton />
        </div>

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
