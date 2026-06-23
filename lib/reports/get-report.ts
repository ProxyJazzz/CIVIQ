import { createClient } from '@/lib/supabase/client'
import type { ReportWithStats } from '@/types/community'

export async function getReport(id: string, userId?: string): Promise<ReportWithStats> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('reports_with_stats')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Report not found.')
  }

  let userHasVoted = false
  let userHasVerified = false

  if (userId) {
    const [voteRes, verifyRes] = await Promise.all([
      supabase.from('votes').select('id').eq('user_id', userId).eq('report_id', id).maybeSingle(),
      supabase
        .from('report_verifications')
        .select('id')
        .eq('user_id', userId)
        .eq('report_id', id)
        .maybeSingle(),
    ])
    userHasVoted = !!voteRes.data
    userHasVerified = !!verifyRes.data
  }

  // Cast row to matching interface
  const row = data as unknown as ReportWithStats

  return {
    ...row,
    user_has_voted: userHasVoted,
    user_has_verified: userHasVerified,
  }
}
