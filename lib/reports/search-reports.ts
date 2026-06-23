'use server'

import { generateEmbedding } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/client'
import type { Report } from '@/types/community'

export async function searchReports(query: string): Promise<Report[]> {
  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  // Fallback keyword-based ILIKE search
  const fallbackSearch = async (): Promise<Report[]> => {
    const supabase = createClient()
    const term = `%${trimmedQuery}%`
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .or(`title.ilike.${term},description.ilike.${term},summary.ilike.${term}`)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw new Error(error.message)
    return data ?? []
  }

  try {
    // Attempt semantic search
    const embedding = await generateEmbedding(trimmedQuery)
    const supabase = createClient()

    const { data: semanticResults, error: rpcError } = await supabase.rpc(
      'search_reports_semantic',
      {
        query_embedding: `[${embedding.join(',')}]`,
        match_threshold: 0.25, // Lenient threshold to fetch top semantic matches
        match_count: 20,
      }
    )

    if (rpcError || !semanticResults || semanticResults.length === 0) {
      if (rpcError) {
        console.warn('Semantic search RPC error, falling back to keyword search:', rpcError.message)
      }
      return await fallbackSearch()
    }

    // Map RPC return columns to match Report type
    return semanticResults.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      image_url: r.image_url,
      category: r.category,
      severity: r.severity,
      status: r.status,
      latitude: r.latitude,
      longitude: r.longitude,
      address: r.address,
      created_at: '', // Placeholder since RPC doesn't return created_at to save bandwidth, but is standard for list
      user_id: '',
      confidence: 0,
      summary: '',
      department: null,
      tags: null,
      ai_summary: null,
      embedding: null,
    })) as unknown as Report[]
  } catch (error) {
    console.warn('Semantic search failed, falling back to keyword search:', error)
    return await fallbackSearch()
  }
}
