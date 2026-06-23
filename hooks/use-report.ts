'use client'

import { useCallback, useState } from 'react'

import { createReport } from '@/lib/report/create-report'
import type { Report, ReportAnalysis } from '@/types/report'

interface UseReportState {
  loading: boolean
  error: string | null
  success: boolean
  report: Report | null
}

interface CreateReportParams {
  file: File
  title: string
  description: string
  latitude: number
  longitude: number
  address: string
  userId: string
  onAnalysis?: (analysis: ReportAnalysis) => void
}

const initialState: UseReportState = {
  loading: false,
  error: null,
  success: false,
  report: null,
}

export function useReport() {
  const [state, setState] = useState<UseReportState>(initialState)

  const reset = useCallback(() => {
    setState(initialState)
  }, [])

  const submitReport = useCallback(async (params: CreateReportParams): Promise<Report | null> => {
    setState({ loading: true, error: null, success: false, report: null })

    const result = await createReport({
      file: params.file,
      title: params.title,
      description: params.description,
      latitude: params.latitude,
      longitude: params.longitude,
      address: params.address,
      userId: params.userId,
    })

    if (!result.success) {
      setState({ loading: false, error: result.error.message, success: false, report: null })
      return null
    }

    setState({ loading: false, error: null, success: true, report: result.data })
    return result.data
  }, [])

  return {
    loading: state.loading,
    error: state.error,
    success: state.success,
    report: state.report,
    submitReport,
    reset,
  }
}
