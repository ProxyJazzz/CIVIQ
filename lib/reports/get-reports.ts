'use server'

import { createClient } from '@/lib/supabase/server'
import { generateEmbedding } from '@/lib/ai/gemini'
import type { FeedFilters, FeedPage, ReportWithStats } from '@/types/community'

const PAGE_SIZE = 12

interface GetReportsOptions {
  filters: FeedFilters
  cursor?: string
  userId?: string
}

export async function getReports({ filters, cursor, userId }: GetReportsOptions): Promise<FeedPage> {
  const supabase = await createClient()

  let query = supabase
    .from('reports_with_stats')
    .select('*')

  // Apply filters
  if (filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  if (filters.severity !== 'all') {
    query = query.eq('severity', filters.severity)
  }

  if (filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  // Hybrid Semantic Search
  if (filters.search && filters.search.trim()) {
    try {
      const queryEmbedding = await generateEmbedding(filters.search.trim())
      const { data: semanticMatches, error: rpcError } = await supabase.rpc(
        'search_reports_semantic',
        {
          query_embedding: `[${queryEmbedding.join(',')}]`,
          match_threshold: 0.25,
          match_count: 50,
        }
      )

      if (rpcError || !semanticMatches || semanticMatches.length === 0) {
        if (rpcError) {
          console.warn('Semantic search RPC error, falling back to keyword search:', rpcError.message)
        }
        const term = `%${filters.search.trim()}%`
        query = query.or(`title.ilike.${term},description.ilike.${term},summary.ilike.${term}`)
      } else {
        const matchedIds = semanticMatches.map((m) => m.id)
        query = query.in('id', matchedIds)
      }
    } catch (err) {
      console.warn('Semantic search embedding failed, falling back to keyword search:', err)
      const term = `%${filters.search.trim()}%`
      query = query.or(`title.ilike.${term},description.ilike.${term},summary.ilike.${term}`)
    }
  }

  // Handle hybrid pagination and sorting
  const sortBy = filters.sortBy || 'newest'

  if (sortBy === 'newest') {
    query = query.order('created_at', { ascending: false })
    if (cursor) {
      query = query.lt('created_at', cursor)
    }
    query = query.limit(PAGE_SIZE + 1)
  } else if (sortBy === 'trending') {
    query = query.order('trending_score', { ascending: false }).order('created_at', { ascending: false })
    const offset = cursor ? parseInt(cursor, 10) : 0
    if (isNaN(offset)) {
      query = query.range(0, PAGE_SIZE)
    } else {
      query = query.range(offset, offset + PAGE_SIZE)
    }
  } else if (sortBy === 'trust') {
    query = query.order('trust_score', { ascending: false }).order('created_at', { ascending: false })
    const offset = cursor ? parseInt(cursor, 10) : 0
    if (isNaN(offset)) {
      query = query.range(0, PAGE_SIZE)
    } else {
      query = query.range(offset, offset + PAGE_SIZE)
    }
  }

  const { data, error } = await query

  if (error) throw new Error(error.message)

  const rows = (data as unknown as ReportWithStats[]) ?? []
  const hasMore = rows.length > PAGE_SIZE
  const page = rows.slice(0, PAGE_SIZE)

  // Determine user interaction state when authenticated
  let userVoteSet = new Set<string>()
  let userVerifySet = new Set<string>()

  if (userId && page.length > 0) {
    const ids = page.map((r) => r.id)

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

  const reports: ReportWithStats[] = page.map((row) => ({
    ...row,
    user_has_voted: userVoteSet.has(row.id),
    user_has_verified: userVerifySet.has(row.id),
  }))

  let nextCursor: string | null = null
  if (hasMore) {
    if (sortBy === 'newest') {
      nextCursor = page[page.length - 1]?.created_at ?? null
    } else {
      const currentOffset = cursor ? parseInt(cursor, 10) : 0
      nextCursor = String(currentOffset + PAGE_SIZE)
    }
  }

  return {
    reports,
    nextCursor,
  }
}
