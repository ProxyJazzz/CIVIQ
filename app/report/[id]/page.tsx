import type { Metadata } from 'next'

import { ReportDetailClient } from '@/components/report/report-detail-client'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface ReportPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Report ${id.slice(0, 8)}`,
    description: 'View civic issue details, AI analysis, community votes and comments.',
  }
}

export default async function ReportDetailPage({ params }: ReportPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <section className="relative -mx-8 -my-10 min-h-screen overflow-hidden px-8 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_hsl(220_80%_18%/0.25)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-background/70" />

      <div className="relative mx-auto max-w-5xl">
        <ReportDetailClient reportId={id} userId={user?.id ?? null} />
      </div>
    </section>
  )
}
