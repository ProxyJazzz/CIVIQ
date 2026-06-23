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
    <section className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} alt={fullName} />
              <AvatarFallback className="text-xl">{getInitials(fullName, email)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{fullName}</h1>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <LogoutButton />
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border bg-background p-4">
            <dt className="text-sm text-muted-foreground">Join date</dt>
            <dd className="mt-1 font-medium">{formatJoinDate(profile?.created_at || user.created_at)}</dd>
          </div>
          <div className="rounded-lg border bg-background p-4">
            <dt className="text-sm text-muted-foreground">Identity provider</dt>
            <dd className="mt-1 font-medium">Google OAuth</dd>
          </div>
        </dl>
      </div>

      {error || !profile ? (
        <Alert variant="destructive">
          <AlertTitle>Profile unavailable</AlertTitle>
          <AlertDescription>
            Your session is active, but your profile could not be loaded. Please sign out and try again.
          </AlertDescription>
        </Alert>
      ) : null}
    </section>
  )
}
