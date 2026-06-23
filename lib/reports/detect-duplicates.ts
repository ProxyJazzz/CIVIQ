'use server'

import { generateEmbedding } from '@/lib/ai/gemini'
import { createClient } from '@/lib/supabase/server'

export interface DuplicateMatch {
  id: string
  title: string
  description: string
  image_url: string
  category: string
  severity: string
  status: string
  latitude: number
  longitude: number
  address: string
  distance_meters: number
  similarity: number
}

export async function detectDuplicateReports(
  title: string,
  description: string,
  latitude: number,
  longitude: number,
  matchThreshold = 0.8,
  maxDistanceMeters = 100
): Promise<DuplicateMatch[]> {
  if (!title.trim() || !description.trim()) {
    return []
  }

  try {
    // Generate text embedding of the input issue
    const textToEmbed = `Title: ${title.trim()}\nDescription: ${description.trim()}`
    const embedding = await generateEmbedding(textToEmbed)

    const supabase = await createClient()
    
    // Call the match_reports RPC
    const { data, error } = await supabase.rpc('match_reports', {
      query_embedding: `[${embedding.join(',')}]`,
      match_threshold: matchThreshold,
      max_distance_meters: maxDistanceMeters,
      input_lat: latitude,
      input_lng: longitude,
    })

    if (error) {
      console.error('Error invoking match_reports RPC:', error.message)
      return []
    }

    return (data as unknown as DuplicateMatch[]) ?? []
  } catch (error) {
    console.error('Error in detectDuplicateReports:', error)
    return []
  }
}
