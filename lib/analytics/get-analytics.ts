'use server'

import { createClient } from "@/lib/supabase/server"

export interface AnalyticsSummary {
  statusData: { status: string; count: number }[]
  categoryData: { category: string; count: number }[]
  severityData: { severity: string; count: number }[]
  trendData: { date: string; count: number }[]
  departmentData: { department: string; avgResolutionHours: number; count: number }[]
  totals: {
    total: number
    pending: number
    assigned: number
    inProgress: number
    resolved: number
    dismissed: number
  }
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const supabase = await createClient()

  const [reportsRes, departmentsRes] = await Promise.all([
    supabase
      .from("reports")
      .select("id, status, category, severity, created_at, resolved_at, department_id"),
    supabase
      .from("departments")
      .select("id, name")
  ])

  if (reportsRes.error) throw new Error(reportsRes.error.message)
  if (departmentsRes.error) throw new Error(departmentsRes.error.message)

  const reports = reportsRes.data || []
  const departments = departmentsRes.data || []
  const depMap = new Map(departments.map((d) => [d.id, d.name]))

  const totals = {
    total: reports.length,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    dismissed: 0,
  }

  const statusCounts: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}
  const severityCounts: Record<string, number> = {}
  const trendCounts: Record<string, number> = {}
  const depResolutionTimes: Record<string, { totalHours: number; count: number }> = {}

  reports.forEach((r) => {
    // Totals
    if (r.status === "pending") totals.pending++
    else if (r.status === "assigned") totals.assigned++
    else if (r.status === "in_progress") totals.inProgress++
    else if (r.status === "resolved") totals.resolved++
    else if (r.status === "dismissed") totals.dismissed++

    // Status counts
    const statusLabel = r.status.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
    statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1

    // Category counts
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1

    // Severity counts
    severityCounts[r.severity] = (severityCounts[r.severity] || 0) + 1

    // Trend counts (Group by YYYY-MM-DD in Local/UTC Date)
    const dateStr = new Date(r.created_at).toISOString().split("T")[0]!
    trendCounts[dateStr] = (trendCounts[dateStr] || 0) + 1

    // Department Resolution Time
    if (r.status === "resolved" && r.resolved_at && r.department_id) {
      const depName = depMap.get(r.department_id) || "Unknown"
      const start = new Date(r.created_at).getTime()
      const end = new Date(r.resolved_at).getTime()
      const hours = (end - start) / (1000 * 60 * 60)
      if (hours >= 0) {
        if (!depResolutionTimes[depName]) {
          depResolutionTimes[depName] = { totalHours: 0, count: 0 }
        }
        depResolutionTimes[depName].totalHours += hours
        depResolutionTimes[depName].count++
      }
    }
  })

  const statusData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
  }))

  const categoryData = Object.entries(categoryCounts).map(([category, count]) => ({
    category,
    count,
  }))

  const severityData = Object.entries(severityCounts).map(([severity, count]) => ({
    severity,
    count,
  }))

  const trendData = Object.entries(trendCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)

  const departmentData = Object.entries(depResolutionTimes).map(([department, data]) => ({
    department,
    avgResolutionHours: Math.round((data.totalHours / data.count) * 10) / 10,
    count: data.count,
  }))

  return {
    statusData,
    categoryData,
    severityData,
    trendData,
    departmentData,
    totals,
  }
}
