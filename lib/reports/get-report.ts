import { createClient } from '@/lib/supabase/client'
import type { ReportWithStats } from '@/types/community'

export async function getReport(id: string, userId?: string): Promise<ReportWithStats> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('reports')
    .select(
      `
      *,
      vote_count:votes(count),
      comment_count:comments(count),
      verification_count:report_verifications(count)
      `,
    )
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

  return {
    ...data,
    vote_count: (data.vote_count as unknown as { count: number }[])[0]?.count ?? 0,
    comment_count: (data.comment_count as unknown as { count: number }[])[0]?.count ?? 0,
    verification_count:
      (data.verification_count as unknown as { count: number }[])[0]?.count ?? 0,
    user_has_voted: userHasVoted,
    user_has_verified: userHasVerified,
  }
}
