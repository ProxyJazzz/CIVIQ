import { z } from 'zod'

export const reportCategories = [
  'Pothole',
  'Garbage',
  'Water Leakage',
  'Streetlight',
  'Road Damage',
  'Drainage',
  'Other',
] as const

export const reportSeverities = ['Low', 'Medium', 'High'] as const

export const reportAnalysisSchema = z.object({
  category: z.enum(reportCategories),
  severity: z.enum(reportSeverities),
  summary: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1),
  department: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
})

export const reportLocationSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().trim().min(1, 'Address is required.').max(240),
})

export const reportFormSchema = z
  .object({
    title: z.string().trim().min(4, 'Title must be at least 4 characters.').max(120),
    description: z.string().trim().min(20, 'Description must be at least 20 characters.').max(1200),
  })
  .extend(reportLocationSchema.shape)

/**
 * Schema used for React Hook Form — lat/lng stored as raw strings to match
 * HTML <input type="number"> value behavior, coerced to number on submit.
 */
export const reportFormInputSchema = z.object({
  title: z.string().trim().min(4, 'Title must be at least 4 characters.').max(120),
  description: z.string().trim().min(20, 'Description must be at least 20 characters.').max(1200),
  latitude: z
    .string()
    .min(1, 'Latitude is required.')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= -90 && parseFloat(v) <= 90, {
      message: 'Latitude must be between -90 and 90.',
    }),
  longitude: z
    .string()
    .min(1, 'Longitude is required.')
    .refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= -180 && parseFloat(v) <= 180, {
      message: 'Longitude must be between -180 and 180.',
    }),
  address: z.string().trim().min(1, 'Address is required.').max(240),
  category: z.enum(reportCategories).optional(),
  severity: z.enum(reportSeverities).optional(),
  department: z.string().trim().optional(),
  summary: z.string().trim().max(500).optional(),
  tags: z.string().trim().optional(),
})

export type ReportFormInputValues = z.infer<typeof reportFormInputSchema>

export const saveReportSchema = reportFormSchema.extend({
  imageUrl: z.string().url(),
  userId: z.string().uuid(),
  category: z.enum(reportCategories),
  severity: z.enum(reportSeverities),
  summary: z.string().trim().min(1).max(500),
  confidence: z.number().min(0).max(1),
  department: z.string().trim().min(1),
  tags: z.array(z.string().trim().min(1)).min(1),
  embedding: z.array(z.number()).optional(),
})
