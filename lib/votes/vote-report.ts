import { createClient } from '@/lib/supabase/client'

export interface VoteResult {
  voted: boolean
  vote_count: number
}

/**
 * Toggle vote on a report.
 * Returns the new voted state and updated count.
 */
export async function voteReport(reportId: string, userId: string): Promise<VoteResult> {
  const supabase = createClient()

  // Check if vote already exists
  const { data: existing } = await supabase
    .from('votes')
    .select('id')
    .eq('report_id', reportId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    // Remove vote (toggle off)
    const { error } = await supabase.from('votes').delete().eq('id', existing.id)
    if (error) throw new Error(error.message)

    const { count, error: countError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId)
    if (countError) throw new Error(countError.message)

    return { voted: false, vote_count: count ?? 0 }
  }

  // Insert new vote
  const { error } = await supabase.from('votes').insert({ report_id: reportId, user_id: userId })
  if (error) throw new Error(error.message)

  const { count, error: countError } = await supabase
    .from('votes')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId)
  if (countError) throw new Error(countError.message)

  return { voted: true, vote_count: count ?? 0 }
}
