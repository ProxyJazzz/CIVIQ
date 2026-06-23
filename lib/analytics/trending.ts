'use server'

import { format, subDays } from 'date-fns'

import { createClient } from '@/lib/supabase/server'
import type { ReportWithStats } from '@/types/community'

export interface AnalyticsSummary {
  totalReports: number
  resolvedReports: number
  inProgressReports: number
  pendingReports: number
  averageTrustScore: number
}

export interface ChartDataPoint {
  label: string
  count: number
  percentage: number
}

export interface ActivityDataPoint {
  date: string
  count: number
}

export interface TrendingAnalytics {
  summary: AnalyticsSummary
  categories: ChartDataPoint[]
  departments: ChartDataPoint[]
  severities: ChartDataPoint[]
  activity: ActivityDataPoint[]
  hotIssues: ReportWithStats[]
}

export async function getTrendingAnalytics(): Promise<TrendingAnalytics> {
  try {
    const supabase = await createClient()

    // Fetch reports with stats for calculations
    const { data: reportsData, error } = await supabase
      .from('reports_with_stats')
      .select('*')
      .order('trending_score', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch analytics data: ${error.message}`)
    }

    const reports = (reportsData as unknown as ReportWithStats[]) ?? []
    const totalReports = reports.length

    // Calculate status counts
    let resolvedReports = 0
    let inProgressReports = 0
    let pendingReports = 0
    let sumTrust = 0

    const categoryMap: Record<string, number> = {}
    const departmentMap: Record<string, number> = {}
    const severityMap: Record<string, number> = {}

    // Initialize daily activity map for the last 7 days
    const activityMap: Record<string, number> = {}
    for (let i = 6; i >= 0; i--) {
      const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd')
      activityMap[dateStr] = 0
    }

    reports.forEach((report) => {
      // Status aggregates
      if (report.status === 'resolved') resolvedReports++
      else if (report.status === 'in_progress') inProgressReports++
      else pendingReports++

      // Trust sum
      sumTrust += report.trust_score || 0

      // Category breakdown
      const cat = report.category || 'Other'
      categoryMap[cat] = (categoryMap[cat] || 0) + 1

      // Department breakdown
      const dept = report.department || 'Unassigned'
      departmentMap[dept] = (departmentMap[dept] || 0) + 1

      // Severity breakdown
      const sev = report.severity || 'Medium'
      severityMap[sev] = (severityMap[sev] || 0) + 1

      // Daily activity (match report date)
      const reportDateStr = format(new Date(report.created_at), 'yyyy-MM-dd')
      if (reportDateStr in activityMap) {
        activityMap[reportDateStr]++
      }
    })

    const averageTrustScore = totalReports > 0 ? Math.round((sumTrust / totalReports) * 10) / 10 : 0

    // Format breakdown helpers
    const formatBreakdown = (map: Record<string, number>): ChartDataPoint[] => {
      return Object.entries(map)
        .map(([label, count]) => ({
          label,
          count,
          percentage: totalReports > 0 ? Math.round((count / totalReports) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
    }

    const categories = formatBreakdown(categoryMap)
    const departments = formatBreakdown(departmentMap)
    const severities = formatBreakdown(severityMap)

    const activity = Object.entries(activityMap).map(([date, count]) => ({
      date: format(new Date(date), 'MMM dd'),
      count,
    }))

    // Get top 4 trending "hot" issues
    const hotIssues = reports.slice(0, 4)

    return {
      summary: {
        totalReports,
        resolvedReports,
        inProgressReports,
        pendingReports,
        averageTrustScore,
      },
      categories,
      departments,
      severities,
      activity,
      hotIssues,
    }
  } catch (error) {
    console.error('Error generating trending analytics:', error)
    // Return empty dashboard structure on error
    return {
      summary: { totalReports: 0, resolvedReports: 0, inProgressReports: 0, pendingReports: 0, averageTrustScore: 0 },
      categories: [],
      departments: [],
      severities: [],
      activity: [],
      hotIssues: [],
    }
  }
}
