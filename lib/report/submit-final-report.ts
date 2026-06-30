'use server'

import { generateEmbedding } from '@/lib/ai/gemini'
import { saveReport } from '@/lib/supabase/save-report'
import type { PipelineResult, Report } from '@/types/report'

interface SubmitFinalReportInput {
  title: string
  description: string
  imageUrl: string
  category: 'Pothole' | 'Garbage' | 'Water Leakage' | 'Streetlight' | 'Road Damage' | 'Drainage' | 'Other'
  severity: 'Low' | 'Medium' | 'High'
  summary: string
  confidence: number
  department: string
  tags: string[]
  latitude: number
  longitude: number
  address: string
  userId: string
}

export async function submitFinalReport(input: SubmitFinalReportInput): Promise<PipelineResult<Report>> {
  let embedding: number[] | undefined
  try {
    const textToEmbed = `Title: ${input.title}\nDescription: ${input.description}`
    embedding = await generateEmbedding(textToEmbed)
  } catch (err) {
    console.error('Embedding generation failed during final report creation:', err)
  }

  return saveReport({
    title: input.title,
    description: input.description,
    imageUrl: input.imageUrl,
    category: input.category,
    severity: input.severity,
    summary: input.summary,
    confidence: input.confidence,
    department: input.department,
    tags: input.tags,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    userId: input.userId,
    embedding,
  })
}
