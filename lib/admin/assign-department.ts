'use server'

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function assignReportDepartment(
  reportId: string,
  departmentId: string | null
) {
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

  // Update report
  const { error } = await supabase
    .from("reports")
    .update({ department_id: departmentId })
    .eq("id", reportId)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath("/admin")
  return { success: true }
}
