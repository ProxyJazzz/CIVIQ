'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function markAllNotificationsAsRead() {
  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthenticated")
  }

  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", user.id)
    .eq("read", false)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/notifications")
  return { success: true }
}
