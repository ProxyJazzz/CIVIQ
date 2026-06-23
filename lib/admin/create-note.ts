'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function createAdminNote(reportId: string, note: string) {
  if (!note.trim()) {
    throw new Error("Note content cannot be empty")
  }

  const supabase = await createClient()

  // Verify auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthenticated")
  }

  // Verify role is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized: Admin privilege required")
  }

  // Insert note
  const { error } = await supabase.from("admin_notes").insert({
    report_id: reportId,
    user_id: user.id,
    note: note.trim(),
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  return { success: true }
}
