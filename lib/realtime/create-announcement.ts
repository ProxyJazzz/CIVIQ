'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface CreateAnnouncementInput {
  title: string
  content: string
  severity: 'Info' | 'Warning' | 'Emergency'
  expiresAt?: string | null
}

export async function createAnnouncement({
  title,
  content,
  severity,
  expiresAt,
}: CreateAnnouncementInput) {
  if (!title.trim() || !content.trim()) {
    throw new Error('Title and content are required')
  }

  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthenticated')
  }

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw new Error('Unauthorized: Admin privilege required')
  }

  // Insert announcement
  const { data, error } = await supabase
    .from('announcements')
    .insert({
      title: title.trim(),
      content: content.trim(),
      severity,
      expires_at: expiresAt || null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/')
  return { success: true, data }
}
