'use server'

import { createClient } from "@/lib/supabase/server"

export async function getReportEvents(reportId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("report_events")
    .select(`
      id,
      report_id,
      user_id,
      event_type,
      from_status,
      to_status,
      description,
      created_at,
      profiles (
        full_name,
        email
      )
    `)
    .eq("report_id", reportId)
    .order("created_at", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []).map((event: any) => ({
    id: event.id,
    report_id: event.report_id,
    user_id: event.user_id,
    event_type: event.event_type,
    from_status: event.from_status,
    to_status: event.to_status,
    description: event.description,
    created_at: event.created_at,
    user_name: event.profiles?.full_name || event.profiles?.email || "System",
  }))
}
