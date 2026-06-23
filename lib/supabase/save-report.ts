'use server'

import { createClient } from '@/lib/supabase/server'
import { saveReportSchema } from '@/schemas/report-schema'
import type { PipelineResult, Report, SaveReportInput } from '@/types/report'

export async function saveReport(input: SaveReportInput): Promise<PipelineResult<Report>> {
  const parsedInput = saveReportSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_REPORT_INPUT',
        message: parsedInput.error.issues[0]?.message ?? 'Invalid report data.',
      },
    }
  }

  try {
    const values = parsedInput.data
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('reports')
      .insert({
        title: values.title,
        description: values.description,
        image_url: values.imageUrl,
        category: values.category,
        severity: values.severity,
        summary: values.summary,
        confidence: values.confidence,
        latitude: values.latitude,
        longitude: values.longitude,
        address: values.address,
        user_id: values.userId,
        status: 'pending',
        department: values.department,
        tags: values.tags,
        ai_summary: values.summary,
        embedding: values.embedding ? `[${values.embedding.join(',')}]` : null,
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: {
          code: 'REPORT_SAVE_FAILED',
          message: error.message,
        },
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'REPORT_SAVE_FAILED',
        message: error instanceof Error ? error.message : 'Unable to save report.',
      },
    }
  }
}
