import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { getDepartments } from "@/lib/admin/get-departments"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"
import type { ReportWithStats } from "@/types/community"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const supabase = await createClient()

  // 1. Verify user session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth")
  }

  // 2. Query user profile role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || profile.role !== "admin") {
    redirect("/feed")
  }

  // Fetch all reports for administrative visibility
  const { data: reports, error } = await supabase
    .from("reports_with_stats")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const departments = await getDepartments()

  const reportsWithStats: ReportWithStats[] = (reports || []).map((r) => ({
    ...r,
    user_has_voted: false,
    user_has_verified: false,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-500 bg-clip-text text-transparent dark:from-white dark:to-neutral-400">
          Civic Operations Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage service requests, assign departments, and review resolution histories.
        </p>
      </div>

      <AdminDashboardClient
        initialReports={reportsWithStats}
        departments={departments}
      />
    </div>
  )
}
