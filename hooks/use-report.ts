'use client'

import { useCallback, useState } from 'react'

import { uploadImage } from '@/lib/supabase/upload-image'
import { analyzeImage } from '@/lib/ai/analyze-image'
import { submitFinalReport } from '@/lib/report/submit-final-report'
import type { Report, ReportAnalysis } from '@/types/report'

interface UseReportState {
  loading: boolean
  uploading: boolean
  analyzing: boolean
  error: string | null
  success: boolean
  report: Report | null
  imageUrl: string | null
  analysis: ReportAnalysis | null
}

const initialState: UseReportState = {
  loading: false,
  uploading: false,
  analyzing: false,
  error: null,
  success: false,
  report: null,
  imageUrl: null,
  analysis: null,
}

export function useReport() {
  const [state, setState] = useState<UseReportState>(initialState)

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const uploadAndAnalyze = useCallback(
    async (file: File): Promise<{ imageUrl: string; analysis: ReportAnalysis } | null> => {
      setState((prev) => ({
        ...prev,
        uploading: true,
        error: null,
        success: false,
        report: null,
        imageUrl: null,
        analysis: null,
      }))

      // 1. Upload to Supabase Storage
      const uploadResult = await uploadImage(file)
      if (!uploadResult.success) {
        setState((prev) => ({ ...prev, uploading: false, error: uploadResult.error.message }))
        return null
      }

      const imageUrl = uploadResult.data
      setState((prev) => ({ ...prev, uploading: false, imageUrl, analyzing: true }))

      // 2. Run Gemini Vision AI Analysis
      const analysisResult = await analyzeImage(imageUrl)
      if (!analysisResult.success) {
        setState((prev) => ({ ...prev, analyzing: false, error: analysisResult.error.message }))
        return null
      }

      const analysis = analysisResult.data
      setState((prev) => ({ ...prev, analyzing: false, analysis }))

      return { imageUrl, analysis }
    },
    [],
  )

  const submitReport = useCallback(
    async (params: {
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
    }): Promise<Report | null> => {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const result = await submitFinalReport(params)
      if (!result.success) {
        setState((prev) => ({ ...prev, loading: false, error: result.error.message }))
        return null
      }

      setState((prev) => ({ ...prev, loading: false, success: true, report: result.data }))
      return result.data
    },
    [],
  )

  return {
    loading: state.loading,
    uploading: state.uploading,
    analyzing: state.analyzing,
    error: state.error,
    success: state.success,
    report: state.report,
    imageUrl: state.imageUrl,
    analysis: state.analysis,
    uploadAndAnalyze,
    submitReport,
    reset,
  }
}
