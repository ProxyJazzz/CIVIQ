'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { voteReport } from '@/lib/votes/vote-report'
import { REPORTS_QUERY_KEY } from '@/hooks/use-reports'

interface UseVotesOptions {
  reportId: string
  userId: string | null
}

export function useVotes({ reportId, userId }: UseVotesOptions) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => {
      if (!userId) throw new Error('Sign in to vote.')
      return voteReport(reportId, userId)
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
    vote: () => mutation.mutate(),
    isPending: mutation.isPending,
  }
}
