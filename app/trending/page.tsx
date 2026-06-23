import type { Metadata } from 'next'

import { TrendingClient } from '@/components/trending/trending-client'
import { getTrendingAnalytics } from '@/lib/analytics/trending'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Trending Analytics',
  description: 'Browse civic issue hotspots, municipal department assignments, and resolution velocity.',
}

export default async function TrendingPage() {
  const analytics = await getTrendingAnalytics()

  return (
    <section className="relative -mx-8 -my-10 min-h-screen overflow-hidden px-8 py-12">
      {/* Background radial glow layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_80%_20%/0.35)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom-right,_hsl(260_60%_15%/0.25)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <TrendingClient initialAnalytics={analytics} />
      </div>
    </section>
  )
}
