'use server'

import { createClient } from '@/lib/supabase/server'

export async function updatePresence(status: 'online' | 'offline' | 'away') {
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Unauthenticated' }
  }

  try {
    // 1. Proactive Profile Self-Healing Check
    // If the trigger was delayed or a user record exists without a public profile,
    // we proactively insert the profile row first to satisfy the foreign key constraint.
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!profile) {
      const emailName = user.email ? user.email.split('@')[0] : 'Citizen'
      await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || emailName,
        avatar_url: user.user_metadata?.avatar_url || null,
      })
    }

    // 2. Upsert user presence
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
      console.error('Failed to upsert user presence:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Unexpected error updating presence:', msg)
    return { success: false, error: msg }
  }
}
