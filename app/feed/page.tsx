import type { Metadata } from 'next'

import { FeedClient } from '@/components/feed/feed-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Community Feed',
  description: 'Browse and search civic issues reported by your community — filtered by category, severity, and status.',
}

export default async function FeedPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <section className="relative -mx-8 -my-10 min-h-screen overflow-hidden px-8 py-12">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top-left,_hsl(220_80%_18%/0.3)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom-right,_hsl(260_60%_12%/0.2)_0%,_transparent_50%)]" />
      <div className="absolute inset-0 bg-background/65 backdrop-blur-[2px]" />

      <div className="relative mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Community Feed</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse civic issues, upvote, verify, and comment to help prioritize community action.
          </p>
        </div>

        <FeedClient userId={user?.id ?? null} />
      </div>
    </section>
  )
}
