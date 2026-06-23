import { createClient } from '@/lib/supabase/client'
import type { FeedFilters, FeedPage, ReportWithStats } from '@/types/community'

const PAGE_SIZE = 12

interface GetReportsOptions {
  filters: FeedFilters
  cursor?: string
  userId?: string
}

export async function getReports({ filters, cursor, userId }: GetReportsOptions): Promise<FeedPage> {
  const supabase = createClient()

  let query = supabase
    .from('reports')
    .select(
      `
      *,
      vote_count:votes(count),
      comment_count:comments(count),
      verification_count:report_verifications(count)
      `,
    )
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  if (filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.severity !== 'all') {
    query = query.eq('severity', filters.severity)
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters.search.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`title.ilike.${term},description.ilike.${term},summary.ilike.${term}`)
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  const rows = data ?? []

  // Determine user interaction state when authenticated
  let userVoteSet = new Set<string>()
  let userVerifySet = new Set<string>()

  if (userId && rows.length > 0) {
    const ids = rows.slice(0, PAGE_SIZE).map((r) => r.id)

    const [voteRes, verifyRes] = await Promise.all([
      supabase.from('votes').select('report_id').eq('user_id', userId).in('report_id', ids),
      supabase
        .from('report_verifications')
        .select('report_id')
        .eq('user_id', userId)
        .in('report_id', ids),
    ])

    userVoteSet = new Set((voteRes.data ?? []).map((v) => v.report_id))
    userVerifySet = new Set((verifyRes.data ?? []).map((v) => v.report_id))
  }

  const hasMore = rows.length > PAGE_SIZE
  const page = rows.slice(0, PAGE_SIZE)

  const reports: ReportWithStats[] = page.map((row) => ({
    ...row,
    // Supabase returns aggregate counts as [{count: N}]
    vote_count: (row.vote_count as unknown as { count: number }[])[0]?.count ?? 0,
    comment_count: (row.comment_count as unknown as { count: number }[])[0]?.count ?? 0,
    verification_count:
      (row.verification_count as unknown as { count: number }[])[0]?.count ?? 0,
    user_has_voted: userVoteSet.has(row.id),
    user_has_verified: userVerifySet.has(row.id),
  }))

  return {
    reports,
    nextCursor: hasMore ? (page[page.length - 1]?.created_at ?? null) : null,
  }
}
