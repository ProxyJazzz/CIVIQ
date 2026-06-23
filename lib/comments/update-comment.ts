import { createClient } from '@/lib/supabase/client'

export async function updateComment(
  commentId: string,
  userId: string,
  content: string,
): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('comments')
    .update({ content: content.trim() })
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
