'use client'

import { useState, useEffect } from "react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts"
import { BarChart3, Activity, Clock, ShieldAlert, FileText } from "lucide-react"

import type { AnalyticsSummary } from "@/lib/analytics/get-analytics"

interface AnalyticsClientProps {
  data: AnalyticsSummary
}

const CATEGORY_COLORS: Record<string, string> = {
  Pothole: "#EF4444", // red
  Garbage: "#00C896", // accent green
  "Water Leakage": "#3B82F6", // blue
  Streetlight: "#F59E0B", // orange
  "Road Damage": "#8B5CF6", // purple
  Drainage: "#EC4899", // pink
  Other: "#64748B", // gray
}

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#00C896", // accent green
  Medium: "#F59E0B", // orange
  High: "#EF4444", // red
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const { categoryData, severityData, trendData, departmentData, totals } = data
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const hasData = totals.total > 0

  if (!mounted || !hasData) {
    if (!mounted && hasData) {
      return (
        <div className="space-y-6 max-w-6xl mx-auto px-4 py-6 animate-pulse">
          {/* Operational Totals Skeleton */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 border border-white/5" />
            ))}
          </div>
          
          {/* Charts Skeleton */}
          <div className="grid gap-6 md:grid-cols-12">
            <div className="md:col-span-12 h-[320px] rounded-3xl bg-white/5 border border-white/5" />
            <div className="md:col-span-6 h-[250px] rounded-3xl bg-white/5 border border-white/5" />
            <div className="md:col-span-6 h-[250px] rounded-3xl bg-white/5 border border-white/5" />
            <div className="md:col-span-12 h-[320px] rounded-3xl bg-white/5 border border-white/5" />
          </div>
        </div>
      )
    }

    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border border-white/8 bg-[#0B0E13]/60 rounded-3xl min-h-[400px]">
        <BarChart3 className="h-14 w-14 text-accent opacity-30 mb-4 animate-pulse" />
        <h3 className="text-lg font-black tracking-tight text-white">No analytics data available</h3>
        <p className="text-xs text-muted-foreground max-w-xs mt-2 leading-relaxed">
          Submit some reports and assign departments to generate real-time operational reports and trends.
        </p>
      </div>
    )
  }

  // Fallback color for missing categories
  const getCategoryColor = (name: string) => CATEGORY_COLORS[name] || "#3B82F6"

  const tooltipContentStyle = {
    background: "#0B0E13",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#FFFFFF",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      {/* ── Operational Totals ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
        {[
          { label: "Total Reports", value: totals.total, color: "text-white" },
          { label: "Pending", value: totals.pending, color: "text-muted-foreground" },
          { label: "Assigned", value: totals.assigned, color: "text-blue-400" },
          { label: "In Progress", value: totals.inProgress, color: "text-amber-400" },
          { label: "Resolved", value: totals.resolved, color: "text-accent" },
          { label: "Dismissed", value: totals.dismissed, color: "text-red-400/80" }
        ].map((card, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 flex flex-col items-center text-center justify-center border border-white/5">
            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest mb-1.5">{card.label}</span>
            <div className={`text-2xl font-black ${card.color} tracking-tighter tabular-nums`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* ── Main Charts Grid ── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Submission Volume Trend */}
        <div className="md:col-span-12 glass-card rounded-3xl p-6 border border-white/5">
          <div className="space-y-1 mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-accent" />
              Submission Volume Trend
            </h3>
            <p className="text-[11px] text-muted-foreground">Daily reports submitted over the last 30 days</p>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C896" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#00C896" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="date" tickLine={false} stroke="rgba(255,255,255,0.3)" style={{ fontSize: 9, fontWeight: "semibold" }} />
                <YAxis tickLine={false} allowDecimals={false} stroke="rgba(255,255,255,0.3)" style={{ fontSize: 9, fontWeight: "semibold" }} />
                <Tooltip contentStyle={tooltipContentStyle} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#00C896"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category breakdown (pie) */}
        <div className="md:col-span-6 glass-card rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <FileText className="h-4 w-4 text-accent" />
              Category Breakdown
            </h3>
            <p className="text-[11px] text-muted-foreground">Distribution of issues by category type</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipContentStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-wrap gap-x-4 gap-y-2 max-w-sm">
              {categoryData.map((entry) => (
                <div key={entry.category} className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(entry.category), boxShadow: `0 0 6px ${getCategoryColor(entry.category)}` }}
                  />
                  <span className="text-muted-foreground">{entry.category}:</span>
                  <span className="text-white font-mono">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="md:col-span-6 glass-card rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
          <div className="space-y-1 mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-accent" />
              Severity Breakdown
            </h3>
            <p className="text-[11px] text-muted-foreground">Issue counts grouped by urgency level</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-[180px] w-[180px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="severity"
                  >
                    {severityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.severity] || "#3B82F6"}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipContentStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex flex-col gap-2 min-w-28">
              {severityData.map((entry) => (
                <div key={entry.severity} className="flex items-center gap-1.5 text-[11px] font-bold">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: SEVERITY_COLORS[entry.severity], boxShadow: `0 0 6px ${SEVERITY_COLORS[entry.severity]}` }}
                  />
                  <span className="text-muted-foreground">{entry.severity}:</span>
                  <span className="text-white font-mono">{entry.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Department Resolution Efficiency */}
        <div className="md:col-span-12 glass-card rounded-3xl p-6 border border-white/5">
          <div className="space-y-1 mb-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              Department Resolution Efficiency
            </h3>
            <p className="text-[11px] text-muted-foreground">Average resolution time in hours per department</p>
          </div>

          {departmentData.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-center text-xs font-bold text-muted-foreground border border-dashed border-white/10 rounded-2xl">
              No resolved issues with department assignments found yet to measure resolution efficiency.
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="department" tickLine={false} stroke="rgba(255,255,255,0.3)" style={{ fontSize: 8, fontWeight: "semibold" }} />
                  <YAxis tickLine={false} stroke="rgba(255,255,255,0.3)" label={{ value: "Hours", angle: -90, position: "insideLeft", fontSize: 9, fill: "rgba(255,255,255,0.3)", offset: 10 }} style={{ fontSize: 9, fontWeight: "semibold" }} />
                  <Tooltip contentStyle={tooltipContentStyle} />
                  <Bar dataKey="avgResolutionHours" fill="#00C896" radius={[6, 6, 0, 0]} name="Avg Resolution (Hours)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
