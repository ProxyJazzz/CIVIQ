'use server'

import { createClient } from '@/lib/supabase/server'
import { saveReportSchema } from '@/schemas/report-schema'
import type { PipelineResult, Report, SaveReportInput } from '@/types/report'

export async function saveReport(input: SaveReportInput): Promise<PipelineResult<Report>> {
  console.log('[Save Report] Parsing inputs against Zod schema...');
  const parsedInput = saveReportSchema.safeParse(input)

  if (!parsedInput.success) {
    console.error('[Save Report] Validation failed:', parsedInput.error.format());
    return {
      success: false,
      error: {
        code: 'INVALID_REPORT_INPUT',
        message: parsedInput.error.issues[0]?.message ?? 'Invalid report input fields.',
      },
    }
  }

  try {
    const values = parsedInput.data
    const supabase = await createClient()

    console.log('[Save Report] Initiating public.reports insert statement...');
    const insertPayload = {
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
    }

    console.log('[Save Report] Insert payload:', {
      ...insertPayload,
      embedding: values.embedding ? `[Vector:${values.embedding.length} dims]` : 'null'
    });

    const { data, error } = await supabase
      .from('reports')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error('[Save Report] Supabase insert operation failed:', error);
      return {
        success: false,
        error: {
          code: 'DATABASE_INSERT_FAILED',
          message: `Supabase query rejected: ${error.message} (${error.code})`,
        },
      }
    }

    console.log(`[Save Report] Insert succeeded. New row publicUrl="${values.imageUrl}"`);
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('[Save Report] Uncaught Exception during database save:', error);
    return {
      success: false,
      error: {
        code: 'DATABASE_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected exception occurred while querying Supabase.',
        stack: error instanceof Error ? error.stack : undefined,
      },
    }
  }
}
