import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { ReportForm } from '@/components/report/report-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Report an Issue',
  description:
    'Upload a photo of a civic issue and let CIVIQ AI classify, prioritize, and route it to the right municipal team.',
}

export default async function ReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <section className="relative -mx-8 -my-10 min-h-screen overflow-hidden px-8 py-12">
      {/* Background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_80%_20%/0.35)_0%,_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom-right,_hsl(260_60%_15%/0.25)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px]" />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <ReportForm userId={user.id} />
      </div>
    </section>
  )
}
