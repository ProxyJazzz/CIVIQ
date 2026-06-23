import { createClient } from '@/lib/supabase/client'
import type { CommentWithAuthor } from '@/types/community'

export async function createComment(
  reportId: string,
  userId: string,
  content: string,
): Promise<CommentWithAuthor> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    .insert({ report_id: reportId, user_id: userId, content: content.trim() })
    .select(
      `
      *,
      author:profiles(full_name, avatar_url)
      `,
    )
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Failed to create comment.')

  return data as unknown as CommentWithAuthor
}

export async function getComments(reportId: string): Promise<CommentWithAuthor[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      *,
      author:profiles(full_name, avatar_url)
      `,
    )
    .eq('report_id', reportId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []) as unknown as CommentWithAuthor[]
}
