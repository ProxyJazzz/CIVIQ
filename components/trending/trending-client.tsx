'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle,
  Users,
  Building,
  Tag,
  ArrowRight,
  Shield,
  MessageSquare,
  ThumbsUp,
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

import type { TrendingAnalytics } from '@/lib/analytics/trending'
import { Badge } from '@/components/shared/badge'
import { Progress } from '@/components/ui/progress'

interface TrendingClientProps {
  initialAnalytics: TrendingAnalytics
}

export function TrendingClient({ initialAnalytics }: TrendingClientProps) {
  const { summary, categories, departments, severities, activity, hotIssues } = initialAnalytics

  // Calculate resolution rate
  const resolutionRate =
    summary.totalReports > 0
      ? Math.round((summary.resolvedReports / summary.totalReports) * 100)
      : 0

  // SVG coordinates for a 7-day activity graph (width 500, height 120)
  const maxCount = Math.max(...activity.map((d) => d.count), 4)
  const points = activity
    .map((d, index) => {
      const x = (index * 500) / 6
      const y = 100 - (d.count * 80) / maxCount
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Activity className="h-5 w-5 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider">CIVIQ Intelligence</span>
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
          Hyperlocal Analytics Engine
        </h1>
        <p className="mt-2 text-muted-foreground">
          Real-time tracking of civic reports, municipal performance routing, and issue severity clusters.
        </p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Issues Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-xl border bg-card/45 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Reports</span>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">{summary.totalReports}</span>
            <p className="text-xs text-muted-foreground mt-1">Issues submitted by community</p>
          </div>
        </motion.div>

        {/* Active Issues Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative overflow-hidden rounded-xl border bg-card/45 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Active Issues</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">
              {summary.pendingReports + summary.inProgressReports}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.inProgressReports} in progress, {summary.pendingReports} pending
            </p>
          </div>
        </motion.div>

        {/* Resolution Rate Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="relative overflow-hidden rounded-xl border bg-card/45 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Resolution Rate</span>
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{resolutionRate}%</span>
              <span className="text-xs text-muted-foreground">
                ({summary.resolvedReports} resolved)
              </span>
            </div>
            <Progress value={resolutionRate} className="h-1.5" />
          </div>
        </motion.div>

        {/* Average Trust Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          className="relative overflow-hidden rounded-xl border bg-card/45 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Avg Trust Index</span>
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-500">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-bold">{summary.averageTrustScore}/10</span>
            <p className="text-xs text-muted-foreground mt-1">Weighted community verification index</p>
          </div>
        </motion.div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols wide) - Activity & Hot Issues */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Activity Graph */}
          <div className="rounded-xl border bg-card/30 p-6 backdrop-blur-sm">
            <h2 className="text-lg font-semibold tracking-tight">Recent Report Velocity</h2>
            <p className="text-xs text-muted-foreground mb-4">Volume of issues reported daily over the past week</p>

            <div className="relative h-32 w-full mt-6">
              {summary.totalReports === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No reporting activity recorded yet.
                </div>
              ) : (
                <>
                  <svg className="h-full w-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* SVG Gradients */}
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                      d={`M 0,100 L ${points} L 500,100 Z`}
                      fill="url(#areaGrad)"
                    />

                    {/* Curve line */}
                    <polyline
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      points={points}
                    />

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  </svg>

                  {/* Dots for daily nodes */}
                  <div className="absolute inset-0 flex justify-between px-0.5">
                    {activity.map((point, index) => {
                      const yPos = 100 - (point.count * 80) / maxCount
                      return (
                        <div
                          key={index}
                          className="group relative flex flex-col items-center"
                          style={{
                            position: 'absolute',
                            left: `${(index * 100) / 6}%`,
                            top: `${yPos}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          <div className="h-2 w-2 rounded-full border border-primary bg-background transition-transform group-hover:scale-150" />
                          <div className="pointer-events-none absolute bottom-4 opacity-0 transition-opacity group-hover:opacity-100 bg-background/95 border px-2 py-0.5 rounded text-[10px] whitespace-nowrap shadow-md z-10">
                            {point.count} issues
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Daily labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 border-t pt-2">
              {activity.map((d, index) => (
                <span key={index}>{d.date}</span>
              ))}
            </div>
          </div>

          {/* Hot / Trending Issues */}
          <div className="rounded-xl border bg-card/30 p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Active Hotspots</h2>
                <p className="text-xs text-muted-foreground">Civic issues receiving high community traction</p>
              </div>
            </div>

            <div className="space-y-4">
              {hotIssues.length === 0 ? (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  No active reports found. Create one to see it trending!
                </div>
              ) : (
                hotIssues.map((report) => (
                  <motion.div
                    key={report.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-card/20 hover:bg-card/45 transition-colors"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-24 w-full md:w-36 overflow-hidden rounded-md border shrink-0">
                      <Image
                        src={report.image_url}
                        alt={report.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 150px"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="category">{report.category}</Badge>
                        <Badge
                          variant={
                            report.severity === 'High'
                              ? 'severity-high'
                              : report.severity === 'Medium'
                              ? 'severity-medium'
                              : 'severity-low'
                          }
                        >
                          {report.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {report.address}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm line-clamp-1">{report.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {report.ai_summary || report.summary}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t text-[11px] text-muted-foreground">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {report.vote_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {report.comment_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-cyan-500" />
                            {report.verification_count} verified
                          </span>
                        </div>

                        <Link
                          href={`/report/${report.id}`}
                          className="flex items-center gap-0.5 text-primary hover:underline font-medium"
                        >
                          Analyze <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (1 col wide) - Category, Dept, Severity breakdown */}
        <div className="space-y-6">
          {/* Issue Categories Breakdown */}
          <div className="rounded-xl border bg-card/30 p-6 backdrop-blur-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Categories</h2>
              <p className="text-xs text-muted-foreground">Classification breakdown of community complaints</p>
            </div>

            <div className="space-y-3 pt-2">
              {categories.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No categories recorded.</div>
              ) : (
                categories.map((item, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <Tag className="h-3 w-3 text-muted-foreground" />
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-1 bg-muted/65" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Responsible Department Routing */}
          <div className="rounded-xl border bg-card/30 p-6 backdrop-blur-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Routing & Department</h2>
              <p className="text-xs text-muted-foreground">AI auto-assigned municipal responsibility routes</p>
            </div>

            <div className="space-y-3 pt-2">
              {departments.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No department routes recorded.</div>
              ) : (
                departments.map((item, index) => (
                  <div key={index} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="flex items-center gap-1.5">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        {item.label}
                      </span>
                      <span className="text-muted-foreground">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-1 bg-cyan-500/20" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Severity Clusters */}
          <div className="rounded-xl border bg-card/30 p-6 backdrop-blur-sm space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Urgency Clusters</h2>
              <p className="text-xs text-muted-foreground">Proportion of high, medium, and low-priority issues</p>
            </div>

            <div className="space-y-3 pt-2">
              {severities.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4 text-center">No severity metrics recorded.</div>
              ) : (
                severities.map((item, index) => {
                  let barColor = 'bg-primary'
                  if (item.label === 'High') barColor = 'bg-rose-500'
                  else if (item.label === 'Medium') barColor = 'bg-amber-500'
                  else if (item.label === 'Low') barColor = 'bg-emerald-500'

                  return (
                    <div key={index} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span>{item.label} Severity</span>
                        <span className="text-muted-foreground">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/65 overflow-hidden">
                        <div
                          className={`h-full ${barColor}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
