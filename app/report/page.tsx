import { redirect } from 'next/navigation'

import { ReportForm } from '@/components/report/report-form'
import { createClient } from '@/lib/supabase/server'

export default async function ReportPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <section className="relative -mx-8 -my-10 overflow-hidden px-8 py-10">
      <div className="absolute inset-0 bg-gradient-to-br from-muted via-background to-secondary" />
      <div className="absolute inset-0 bg-background/55" />
      <div className="relative mx-auto max-w-5xl">
        <ReportForm />
      </div>
    </section>
  )
}
