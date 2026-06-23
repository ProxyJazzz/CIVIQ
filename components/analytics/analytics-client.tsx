'use client'

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

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { AnalyticsSummary } from "@/lib/analytics/get-analytics"

interface AnalyticsClientProps {
  data: AnalyticsSummary
}

const CATEGORY_COLORS: Record<string, string> = {
  Pothole: "#ef4444", // red
  Garbage: "#10b981", // green
  "Water Leakage": "#3b82f6", // blue
  Streetlight: "#f59e0b", // amber
  "Road Damage": "#8b5cf6", // purple
  Drainage: "#ec4899", // pink
  Other: "#6b7280", // gray
}

const SEVERITY_COLORS: Record<string, string> = {
  Low: "#3b82f6", // blue
  Medium: "#f59e0b", // amber
  High: "#ef4444", // red
}

export function AnalyticsClient({ data }: AnalyticsClientProps) {
  const { categoryData, severityData, trendData, departmentData, totals } = data

  const hasData = totals.total > 0

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-card min-h-[400px]">
        <BarChart3 className="h-16 w-16 text-muted-foreground opacity-30 mb-4 animate-pulse" />
        <h3 className="text-xl font-bold tracking-tight">No analytics data available</h3>
        <p className="text-sm text-muted-foreground max-w-sm mt-2">
          Submit some reports and assign departments to generate real-time operational reports and trends.
        </p>
      </div>
    )
  }

  // Fallback color for missing categories
  const getCategoryColor = (name: string) => CATEGORY_COLORS[name] || "#6366f1"

  return (
    <div className="space-y-6">
      {/* ── Operational Totals ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-6">
        <Card className="bg-background shadow-sm border">
          <CardContent className="p-6 flex flex-col items-center text-center justify-center">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Total Reports</span>
            <div className="text-3xl font-extrabold">{totals.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-sm border">
          <CardContent className="p-6 flex flex-col items-center text-center justify-center">
            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-1">Pending</span>
            <div className="text-3xl font-extrabold text-neutral-500">{totals.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-sm border">
          <CardContent className="p-6 flex flex-col items-center text-center justify-center">
            <span className="text-[10px] uppercase font-bold text-sky-500 tracking-wider mb-1">Assigned</span>
            <div className="text-3xl font-extrabold text-sky-500">{totals.assigned}</div>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-sm border">
          <CardContent className="p-6 flex flex-col items-center text-center justify-center">
            <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider mb-1">In Progress</span>
            <div className="text-3xl font-extrabold text-amber-500">{totals.inProgress}</div>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-sm border">
          <CardContent className="p-6 flex flex-col items-center text-center justify-center">
            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider mb-1">Resolved</span>
            <div className="text-3xl font-extrabold text-emerald-500">{totals.resolved}</div>
          </CardContent>
        </Card>
        <Card className="bg-background shadow-sm border">
          <CardContent className="p-6 flex flex-col items-center text-center justify-center">
            <span className="text-[10px] uppercase font-bold text-red-500 tracking-wider mb-1">Dismissed</span>
            <div className="text-3xl font-extrabold text-red-500">{totals.dismissed}</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Charts Grid ── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Trend line: md=12 */}
        <Card className="md:col-span-12 shadow-sm border bg-card">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Submission Volume Trend
            </CardTitle>
            <CardDescription>Daily reports submitted over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="date" tickLine={false} style={{ fontSize: 10 }} />
                  <YAxis tickLine={false} allowDecimals={false} style={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Category distribution (pie): md=6 */}
        <Card className="md:col-span-6 shadow-sm border bg-card">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Category Breakdown
            </CardTitle>
            <CardDescription>Distribution of issues by category type</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="category"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 max-w-sm">
              {categoryData.map((entry) => (
                <div key={entry.category} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: getCategoryColor(entry.category) }}
                  />
                  <span className="text-muted-foreground font-medium">{entry.category}:</span>
                  <span className="font-bold text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity Distribution: md=6 */}
        <Card className="md:col-span-6 shadow-sm border bg-card">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              Severity Breakdown
            </CardTitle>
            <CardDescription>Issue counts grouped by urgency level</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="h-[200px] w-[200px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                    nameKey="severity"
                  >
                    {severityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SEVERITY_COLORS[entry.severity] || "#6366f1"}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: 11,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 min-w-28">
              {severityData.map((entry) => (
                <div key={entry.severity} className="flex items-center gap-1.5 text-xs">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: SEVERITY_COLORS[entry.severity] }}
                  />
                  <span className="text-muted-foreground font-medium">{entry.severity}:</span>
                  <span className="font-bold text-foreground">{entry.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resolution time by department: md=12 */}
        <Card className="md:col-span-12 shadow-sm border bg-card">
          <CardHeader>
            <CardTitle className="text-md flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Department Resolution Efficiency
            </CardTitle>
            <CardDescription>Average resolution time in hours per department</CardDescription>
          </CardHeader>
          <CardContent>
            {departmentData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                No resolved issues with department assignments found yet to measure resolution efficiency.
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="department" tickLine={false} style={{ fontSize: 9 }} />
                    <YAxis tickLine={false} label={{ value: "Hours", angle: -90, position: "insideLeft", fontSize: 10 }} style={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        background: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        fontSize: 11,
                      }}
                    />
                    <Bar dataKey="avgResolutionHours" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Avg Resolution (Hours)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
