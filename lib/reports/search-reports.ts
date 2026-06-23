import { createClient } from '@/lib/supabase/client'
import type { Report } from '@/types/community'

export async function searchReports(query: string): Promise<Report[]> {
  if (!query.trim()) return []

  const supabase = createClient()
  const term = `%${query.trim()}%`

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .or(`title.ilike.${term},description.ilike.${term},summary.ilike.${term}`)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)

  return data ?? []
}
