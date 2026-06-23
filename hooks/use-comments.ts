'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { createComment, getComments } from '@/lib/comments/create-comment'
import { deleteComment } from '@/lib/comments/delete-comment'
import { updateComment } from '@/lib/comments/update-comment'

export const COMMENTS_QUERY_KEY = 'comments'

export function useComments(reportId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [COMMENTS_QUERY_KEY, reportId],
    queryFn: () => getComments(reportId),
  })

  const addComment = useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) =>
      createComment(reportId, userId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, reportId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const editComment = useMutation({
    mutationFn: ({ commentId, userId, content }: { commentId: string; userId: string; content: string }) =>
      updateComment(commentId, userId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, reportId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const removeComment = useMutation({
    mutationFn: ({ commentId, userId }: { commentId: string; userId: string }) =>
      deleteComment(commentId, userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, reportId] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    addComment,
    editComment,
    removeComment,
  }
}
