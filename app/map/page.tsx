import type { Metadata } from 'next'

import { MapClient } from '@/components/map/map-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Issue Map',
  description: 'View civic issues on an interactive map with severity-coded markers and trust score popups.',
}

export default async function MapPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <section className="relative -mx-8 -my-10 min-h-screen overflow-hidden px-8 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top-right,_hsl(220_70%_15%/0.3)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-background/70" />

      <div className="relative mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issue Map</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Explore civic issues geographically — color-coded by severity.
          </p>
        </div>

        <MapClient userId={user?.id ?? null} />
      </div>
    </section>
  )
}
