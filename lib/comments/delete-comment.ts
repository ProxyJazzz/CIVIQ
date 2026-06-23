import { createClient } from '@/lib/supabase/client'

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId)

  if (error) throw new Error(error.message)
}
