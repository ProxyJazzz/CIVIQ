'use server'

import { createClient } from "@/lib/supabase/server"

export async function getAdminNotes(reportId: string) {
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

  const { data, error } = await supabase
    .from("admin_notes")
    .select(`
      id,
      report_id,
      user_id,
      note,
      created_at,
      profiles (
        full_name,
        email,
        avatar_url
      )
    `)
    .eq("report_id", reportId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((note: any) => ({
    id: note.id,
    report_id: note.report_id,
    user_id: note.user_id,
    note: note.note,
    created_at: note.created_at,
    author_name: note.profiles?.full_name || note.profiles?.email || "Admin",
    author_avatar: note.profiles?.avatar_url,
  }))
}
