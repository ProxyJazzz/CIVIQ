import { createClient } from '@/lib/supabase/client'

export interface VerifyResult {
  verified: boolean
  verification_count: number
}

/**
 * Toggle verification ("I am experiencing this too").
 * Returns new verified state and updated count.
 */
export async function verifyReport(reportId: string, userId: string): Promise<VerifyResult> {
  const supabase = createClient()

  const { data: existing } = await supabase
    .from('report_verifications')
    .select('id')
    .eq('report_id', reportId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('report_verifications')
      .delete()
      .eq('id', existing.id)
    if (error) throw new Error(error.message)

    const { count, error: countError } = await supabase
      .from('report_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId)
    if (countError) throw new Error(countError.message)

    return { verified: false, verification_count: count ?? 0 }
  }

  const { error } = await supabase
    .from('report_verifications')
    .insert({ report_id: reportId, user_id: userId })
  if (error) throw new Error(error.message)

  const { count, error: countError } = await supabase
    .from('report_verifications')
    .select('*', { count: 'exact', head: true })
    .eq('report_id', reportId)
  if (countError) throw new Error(countError.message)

  return { verified: true, verification_count: count ?? 0 }
}
