'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePresence(status: 'online' | 'offline' | 'away') {
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthenticated')
  }

  // Upsert user presence
  const { error } = await supabase
    .from('user_presence')
    .upsert(
      {
        user_id: user.id,
        status,
        last_seen_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id',
      }
    )

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}
