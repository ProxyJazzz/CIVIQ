'use client'

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
import { SafeImage } from '@/components/shared/safe-image'

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
    <div className="space-y-8 max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-accent">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest">CIVIQ Intelligence Desk</span>
        </div>
        <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
          Trending Analytics Engine
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Real-time tracking of community incident reports, municipal department dispatches, and resolution velocities.
        </p>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Issues Card */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#0B0E13]/60 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Total Reports</span>
            <div className="rounded-lg bg-white/5 p-2 text-white/70">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-2xl font-black text-white tracking-tight tabular-nums">{summary.totalReports}</div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Submitted by community</p>
          </div>
        </div>

        {/* Active Issues Card */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#0B0E13]/60 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Active Issues</span>
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-2xl font-black text-white tracking-tight tabular-nums">
              {summary.pendingReports + summary.inProgressReports}
            </div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
              {summary.inProgressReports} in progress &middot; {summary.pendingReports} pending
            </p>
          </div>
        </div>

        {/* Resolution Rate Card */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#0B0E13]/60 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Resolution Rate</span>
            <div className="rounded-lg bg-accent/10 p-2 text-accent">
              <CheckCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white tracking-tight tabular-nums">{resolutionRate}%</span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold">
                ({summary.resolvedReports} resolved)
              </span>
            </div>
            <Progress value={resolutionRate} className="h-1 bg-white/10" />
          </div>
        </div>

        {/* Average Trust Score Card */}
        <div className="glass-card rounded-2xl border border-white/5 bg-[#0B0E13]/60 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            <span>Avg Trust Index</span>
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="text-2xl font-black text-white tracking-tight tabular-nums">{summary.averageTrustScore}/10</div>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">Citizen verification score</p>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 cols wide) - Activity & Hot Issues */}
        <div className="space-y-6 lg:col-span-2">
          {/* Recent Activity Graph */}
          <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 shadow-xl">
            <h2 className="text-sm font-black uppercase tracking-wider text-white">Recent Report Velocity</h2>
            <p className="text-[10px] text-muted-foreground mb-4 font-semibold uppercase tracking-wider">Volume of issues reported daily over the past week</p>

            <div className="relative h-32 w-full mt-6">
              {summary.totalReports === 0 ? (
                <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground uppercase">
                  No reporting activity recorded yet.
                </div>
              ) : (
                <>
                  <svg className="h-full w-full" viewBox="0 0 500 100" preserveAspectRatio="none">
                    {/* SVG Gradients */}
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00C896" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#00C896" stopOpacity="0" />
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
                      stroke="#00C896"
                      strokeWidth="2.5"
                      points={points}
                    />

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
                    <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.03)" strokeDasharray="3" />
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
                          <div className="h-2 w-2 rounded-full border border-accent bg-[#050608] transition-transform group-hover:scale-150 shadow-md shadow-accent" />
                          <div className="pointer-events-none absolute bottom-4 opacity-0 transition-opacity group-hover:opacity-100 bg-[#0B0E13] border border-white/8 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-xl z-10">
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
            <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-2 border-t border-white/5 pt-2">
              {activity.map((d, index) => (
                <span key={index}>{d.date}</span>
              ))}
            </div>
          </div>

          {/* Hot / Trending Issues */}
          <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Active Hotspots</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Civic issues receiving high community traction</p>
            </div>

            <div className="space-y-4">
              {hotIssues.length === 0 ? (
                <div className="text-center py-10 text-xs font-bold text-muted-foreground uppercase">
                  No active reports found. Create one to see it trending!
                </div>
              ) : (
                hotIssues.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-white/5 bg-[#0B0E13]/30 hover:bg-white/5 transition-all duration-200"
                  >
                    {/* Thumbnail Image */}
                    <div className="relative h-24 w-full md:w-36 overflow-hidden rounded-xl border border-white/5 shrink-0 bg-[#050608]">
                      <SafeImage
                        src={report.image_url}
                        alt={report.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 150px"
                      />
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="category" className="font-bold text-[9px] uppercase tracking-wider">{report.category}</Badge>
                        <Badge
                          variant={
                            report.severity === 'High'
                              ? 'severity-high'
                              : report.severity === 'Medium'
                              ? 'severity-medium'
                              : 'severity-low'
                          }
                          className="font-bold text-[9px] uppercase tracking-wider"
                        >
                          {report.severity}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground ml-auto truncate max-w-[150px]">
                          {report.address}
                        </span>
                      </div>

                      <h3 className="font-bold text-xs sm:text-sm text-white line-clamp-1">{report.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {report.ai_summary || report.summary}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" /> {report.vote_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> {report.comment_count}
                          </span>
                          <span className="flex items-center gap-1">
                            <Shield className="h-3 w-3 text-accent" />
                            {report.verification_count} verified
                          </span>
                        </div>

                        <Link
                          href={`/report/${report.id}`}
                          className="flex items-center gap-0.5 text-accent hover:underline font-black"
                        >
                          Analyze <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col wide) - Category, Dept, Severity breakdown */}
        <div className="space-y-6">
          {/* Issue Categories Breakdown */}
          <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Categories</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Classification breakdown of complaints</p>
            </div>

            <div className="space-y-4 pt-2">
              {categories.length === 0 ? (
                <div className="text-xs font-bold text-muted-foreground py-4 text-center uppercase">No categories recorded.</div>
              ) : (
                categories.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#A0AEC0]">
                        <Tag className="h-3 w-3 text-accent" />
                        {item.label}
                      </span>
                      <span className="text-white font-mono">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-1 bg-white/5" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Responsible Department Routing */}
          <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Department Routing</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">AI auto-assigned municipal pathways</p>
            </div>

            <div className="space-y-4 pt-2">
              {departments.length === 0 ? (
                <div className="text-xs font-bold text-muted-foreground py-4 text-center uppercase">No department routes recorded.</div>
              ) : (
                departments.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="flex items-center gap-1.5 text-[#A0AEC0]">
                        <Building className="h-3.5 w-3.5 text-blue-400" />
                        {item.label}
                      </span>
                      <span className="text-white font-mono">
                        {item.count} ({item.percentage}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-1 bg-white/5" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Severity Clusters */}
          <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Urgency Clusters</h2>
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Proportion of severity priorities</p>
            </div>

            <div className="space-y-4 pt-2">
              {severities.length === 0 ? (
                <div className="text-xs font-bold text-muted-foreground py-4 text-center uppercase">No severity metrics recorded.</div>
              ) : (
                severities.map((item, index) => {
                  let barColor = 'bg-accent'
                  if (item.label === 'High') barColor = 'bg-rose-500'
                  else if (item.label === 'Medium') barColor = 'bg-amber-500'
                  else if (item.label === 'Low') barColor = 'bg-accent'

                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#A0AEC0]">{item.label} Severity</span>
                        <span className="text-white font-mono">
                          {item.count} ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
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
