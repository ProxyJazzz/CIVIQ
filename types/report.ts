import type { z } from 'zod'

import {
  reportAnalysisSchema,
  reportCategories,
  reportFormInputSchema,
  reportFormSchema,
  reportLocationSchema,
  reportSeverities,
  saveReportSchema,
} from '@/schemas/report-schema'
import type { Database } from '@/types/database'

export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>
export type ReportFormValues = z.infer<typeof reportFormSchema>
export type ReportFormInputValues = z.infer<typeof reportFormInputSchema>
export type ReportLocation = z.infer<typeof reportLocationSchema>
export type SaveReportInput = z.infer<typeof saveReportSchema>
export type Report = Database['public']['Tables']['reports']['Row']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']

export interface PipelineError {
  code: string
  message: string
  stack?: string
}

export type PipelineResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: PipelineError
    }

export interface ReportActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  reportId?: string
}

export {
  reportAnalysisSchema,
  reportCategories,
  reportFormInputSchema,
  reportFormSchema,
  reportLocationSchema,
  reportSeverities,
  saveReportSchema,
}
