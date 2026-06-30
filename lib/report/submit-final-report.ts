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
  console.log('[Submit Final Report] Server Action triggered.');
  console.log(`[Submit Final Report] Inputs: title="${input.title}", category="${input.category}", severity="${input.severity}", userId="${input.userId}"`);

  let embedding: number[] | undefined
  try {
    const textToEmbed = `Title: ${input.title}\nDescription: ${input.description}`
    console.log('[Submit Final Report] Triggering text embedding generation...');
    embedding = await generateEmbedding(textToEmbed)
    console.log(`[Submit Final Report] Embedding generated successfully. Vector dimensions=${embedding.length}`);
  } catch (err) {
    console.error('[Submit Final Report] Embedding generation failed (continuing report creation without vectors):', err);
  }

  try {
    console.log('[Submit Final Report] Database insert starting via saveReport...');
    const result = await saveReport({
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

    if (result.success) {
      console.log(`[Submit Final Report] Database insert completed. Created record ID: "${result.data.id}"`);
    } else {
      console.error('[Submit Final Report] Database insert failed:', result.error);
    }

    console.log('[Submit Final Report] Response returned to client.');
    return result
  } catch (error) {
    console.error('[Submit Final Report] Uncaught Exception during submission pipeline:', error);
    return {
      success: false,
      error: {
        code: 'REPORT_SUBMISSION_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected exception occurred during final report submission.',
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}
