'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { verifyReport } from '@/lib/verifications/verify-report'
import { REPORTS_QUERY_KEY } from '@/hooks/use-reports'

interface UseVerificationsOptions {
  reportId: string
  userId: string | null
}

export function useVerifications({ reportId, userId }: UseVerificationsOptions) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Sign in to verify.')
      return verifyReport(reportId, userId)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [REPORTS_QUERY_KEY] })
      void queryClient.invalidateQueries({ queryKey: ['report', reportId] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return {
    verify: () => mutation.mutate(),
    isPending: mutation.isPending,
  }
}
