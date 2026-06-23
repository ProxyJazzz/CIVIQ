'use server'

import { analyzeImage } from '@/lib/ai/analyze-image'
import { generateEmbedding } from '@/lib/ai/gemini'
import { saveReport } from '@/lib/supabase/save-report'
import { uploadImage } from '@/lib/supabase/upload-image'
import type { PipelineResult, Report, SaveReportInput } from '@/types/report'

interface CreateReportInput {
  file: File
  title: string
  description: string
  latitude: number
  longitude: number
  address: string
  userId: string
}

export async function createReport(input: CreateReportInput): Promise<PipelineResult<Report>> {
  // Step 1 — Upload image to Supabase Storage
  const uploadResult = await uploadImage(input.file)

  if (!uploadResult.success) {
    return uploadResult
  }

  const imageUrl = uploadResult.data

  // Step 2 — Analyze image with Gemini Vision
  const analysisResult = await analyzeImage(imageUrl, input.description)

  if (!analysisResult.success) {
    return analysisResult
  }

  const analysis = analysisResult.data

  // Step 3 — Generate semantic embedding for duplication & search matching
  let embedding: number[] | undefined
  try {
    const textToEmbed = `Title: ${input.title}\nDescription: ${input.description}`
    embedding = await generateEmbedding(textToEmbed)
  } catch (err) {
    console.error('Embedding generation failed during report creation:', err)
  }

  // Step 4 — Save report to database
  const saveInput: SaveReportInput = {
    title: input.title,
    description: input.description,
    imageUrl,
    category: analysis.category,
    severity: analysis.severity,
    summary: analysis.summary,
    confidence: analysis.confidence,
    latitude: input.latitude,
    longitude: input.longitude,
    address: input.address,
    userId: input.userId,
    department: analysis.department,
    tags: analysis.tags,
    embedding,
  }

  return saveReport(saveInput)
}
