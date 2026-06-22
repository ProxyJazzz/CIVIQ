import { z } from 'zod'

import type { Database } from '@/types/database'

export const reportCategories = ['Pothole', 'Garbage', 'Water Leakage', 'Streetlight', 'Traffic', 'Other'] as const
export const reportSeverities = ['Low', 'Medium', 'High'] as const

export const reportAnalysisSchema = z.object({
  category: z.enum(reportCategories),
  severity: z.enum(reportSeverities),
  confidence: z.number().min(0).max(1),
  summary: z.string().min(10).max(500),
})

export const reportFormSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters.').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters.').max(1200),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().trim().min(6, 'Address is required.').max(240),
})

export type ReportAnalysis = z.infer<typeof reportAnalysisSchema>
export type ReportFormValues = z.infer<typeof reportFormSchema>
export type Report = Database['public']['Tables']['reports']['Row']
export type ReportInsert = Database['public']['Tables']['reports']['Insert']

export interface ReportActionState {
  status: 'idle' | 'success' | 'error'
  message?: string
  reportId?: string
}
