'use client'

import { useState, useEffect } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Building,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Send,
  MessageSquare,
  History,
  AlertCircle,
  Play,
  Check,
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { assignReportDepartment } from "@/lib/admin/assign-department"
import { updateReportStatus } from "@/lib/admin/update-status"
import { createAdminNote } from "@/lib/admin/create-note"
import { getAdminNotes } from "@/lib/admin/get-notes"
import { getReportEvents } from "@/lib/admin/get-events"
import { createClient } from "@/lib/supabase/client"
import { createAnnouncement } from "@/lib/realtime/create-announcement"

import type { ReportWithStats, Department, ReportStatus } from "@/types/community"

interface AdminDashboardClientProps {
  initialReports: ReportWithStats[]
  departments: Department[]
}

const statusFilters = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Assigned", value: "assigned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Resolved", value: "resolved" },
  { label: "Dismissed", value: "dismissed" },
]

export function AdminDashboardClient({
  initialReports,
  departments,
}: AdminDashboardClientProps) {
  const [reports, setReports] = useState<ReportWithStats[]>(initialReports)
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [noteText, setNoteText] = useState<string>("")

  // Real-time Announcements States
  const [annTitle, setAnnTitle] = useState("")
  const [annContent, setAnnContent] = useState("")
  const [annSeverity, setAnnSeverity] = useState<"Info" | "Warning" | "Emergency">("Info")
  const [annExpiresHrs, setAnnExpiresHrs] = useState("")

  const supabase = createClient()

  // TanStack Query for Announcements
  const { data: adminAnnouncements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false })
      if (error) throw error
      return data
    },
  })

  // Subscribe to real-time updates for announcements
  useEffect(() => {
    const channel = supabase
      .channel("admin-announcements-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        () => {
          void refetchAnnouncements()
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase, refetchAnnouncements])

  // Mutation to broadcast announcement
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      let expiresAt: string | null = null
      if (annExpiresHrs) {
        expiresAt = new Date(Date.now() + parseFloat(annExpiresHrs) * 60 * 60 * 1000).toISOString()
      }
      return createAnnouncement({
        title: annTitle,
        content: annContent,
        severity: annSeverity,
        expiresAt,
      })
    },
    onSuccess: () => {
      setAnnTitle("")
      setAnnContent("")
      setAnnExpiresHrs("")
      setAnnSeverity("Info")
      toast.success("Announcement broadcasted successfully")
      void refetchAnnouncements()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to broadcast announcement")
    },
  })

  // Mutation to delete/revoke announcement
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success("Announcement revoked successfully")
      void refetchAnnouncements()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to revoke announcement")
    },
  })

  // Subscribe to reports real-time changes inside the admin dashboard to refresh live timeline and lists!
  useEffect(() => {
    const channel = supabase
      .channel("admin-reports-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reports" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const { data: enrichedReport } = await supabase
              .from("reports_with_stats")
              .select("*")
              .eq("id", payload.new.id)
              .single()
            if (enrichedReport) {
              setReports((prev) => [enrichedReport as ReportWithStats, ...prev])
            }
          } else if (payload.eventType === "UPDATE") {
            const { data: enrichedReport } = await supabase
              .from("reports_with_stats")
              .select("*")
              .eq("id", payload.new.id)
              .single()
            if (enrichedReport) {
              setReports((prev) =>
                prev.map((r) => (r.id === payload.new.id ? (enrichedReport as ReportWithStats) : r))
              )
            }
          } else if (payload.eventType === "DELETE") {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [supabase])

  const selectedReport = reports.find((r) => r.id === selectedReportId)


  // TanStack Query for Notes
  const {
    data: notes = [],
    isLoading: isLoadingNotes,
    refetch: refetchNotes,
  } = useQuery({
    queryKey: ["admin-notes", selectedReportId],
    queryFn: () => getAdminNotes(selectedReportId!),
    enabled: !!selectedReportId,
  })

  // TanStack Query for Events
  const {
    data: events = [],
    isLoading: isLoadingEvents,
    refetch: refetchEvents,
  } = useQuery({
    queryKey: ["report-events", selectedReportId],
    queryFn: () => getReportEvents(selectedReportId!),
    enabled: !!selectedReportId,
  })

  // Mutate Status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) =>
      updateReportStatus(id, status),
    onMutate: async ({ id, status }) => {
      // Optimistic update
      setReports((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      )
    },
    onSuccess: () => {
      toast.success("Report status updated successfully")
      void refetchEvents()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update status")
      // Revert reports on error
      setReports(initialReports)
    },
  })

  // Mutate Department
  const departmentMutation = useMutation({
    mutationFn: ({ id, depId }: { id: string; depId: string | null }) =>
      assignReportDepartment(id, depId),
    onMutate: async ({ id, depId }) => {
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                department_id: depId,
                status: r.status === "pending" && depId ? "assigned" : r.status,
              }
            : r
        )
      )
    },
    onSuccess: () => {
      toast.success("Department assigned successfully")
      void refetchEvents()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to assign department")
      setReports(initialReports)
    },
  })

  // Mutate Notes
  const noteMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      createAdminNote(id, note),
    onSuccess: () => {
      setNoteText("")
      toast.success("Note added successfully")
      void refetchNotes()
      void refetchEvents()
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add note")
    },
  })

  // Group counts for metrics
  const counts = reports.reduce(
    (acc, cur) => {
      acc.total++
      if (cur.status === "pending") acc.pending++
      else if (cur.status === "assigned") acc.assigned++
      else if (cur.status === "in_progress") acc.inProgress++
      else if (cur.status === "resolved") acc.resolved++
      return acc
    },
    { total: 0, pending: 0, assigned: 0, inProgress: 0, resolved: 0 }
  )

  // Filters logic
  const filteredReports = reports.filter((r) => {
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-neutral-500/10 text-neutral-500 border-neutral-500/20">Pending</Badge>
      case "assigned":
        return <Badge variant="info">Assigned</Badge>
      case "in_progress":
        return <Badge variant="warning">In Progress</Badge>
      case "resolved":
        return <Badge variant="success">Resolved</Badge>
      case "dismissed":
        return <Badge variant="destructive">Dismissed</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "Low":
        return <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20">Low</Badge>
      case "Medium":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Medium</Badge>
      case "High":
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">High</Badge>
      default:
        return <Badge variant="secondary">{severity}</Badge>
    }
  }

  const handleCreateAnnouncement = () => {
    if (!annTitle.trim() || !annContent.trim()) {
      toast.error("Title and content are required")
      return
    }
    broadcastMutation.mutate()
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-4 py-6">
      <Tabs defaultValue="operations" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-white/5">
          <TabsList className="glass-panel rounded-full p-1 bg-white/5 border border-white/8 self-start">
            <TabsTrigger value="operations" className="rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground hover:text-white">Report Operations</TabsTrigger>
            <TabsTrigger value="announcements" className="rounded-full px-5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-muted-foreground hover:text-white">Emergency Alerts</TabsTrigger>
          </TabsList>
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
            Logged in as Dispatch Officer &middot; Real-time active
          </div>
        </div>

        <TabsContent value="operations" className="space-y-6 mt-6">
          {/* ── Metric Summary Cards ── */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            {[
              { label: "Total Reports", value: counts.total, icon: <Building className="h-4 w-4 text-white" />, color: "text-white" },
              { label: "Pending Verification", value: counts.pending, icon: <Clock className="h-4 w-4 text-muted-foreground" />, color: "text-muted-foreground" },
              { label: "Assigned Dispatch", value: counts.assigned, icon: <Building className="h-4 w-4 text-blue-400" />, color: "text-blue-400" },
              { label: "In Progress", value: counts.inProgress, icon: <Play className="h-4 w-4 text-amber-500" />, color: "text-amber-500" },
              { label: "Resolved", value: counts.resolved, icon: <CheckCircle className="h-4 w-4 text-accent animate-pulse" />, color: "text-accent" }
            ].map((stat, idx) => (
              <div key={idx} className="glass-card rounded-2xl p-4 flex flex-col justify-between border border-white/5">
                <div className="flex items-center justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  <span>{stat.label}</span>
                  {stat.icon}
                </div>
                <div className={`text-2xl font-black ${stat.color} tracking-tighter mt-3 tabular-nums`}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ── Operational Dual Pane ── */}
          <div className="grid gap-6 lg:grid-cols-12 min-h-[600px] items-start">
            {/* Left List Pane: lg=5 */}
            <div className={`space-y-4 lg:col-span-5 ${selectedReportId ? "hidden lg:block" : "block"}`}>
              <div className="flex flex-col gap-3">
                {/* Search */}
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter incidents by title/address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Pills */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full no-scrollbar">
                  {statusFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant="outline"
                      size="sm"
                      onClick={() => setStatusFilter(filter.value)}
                      className={cn(
                        "rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap h-7.5 px-3 border transition-all duration-200",
                        statusFilter === filter.value
                          ? "bg-accent text-accent-foreground border-accent/20"
                          : "bg-white/5 border-white/5 text-muted-foreground hover:text-white"
                      )}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Reports Scrolling Container */}
              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1 no-scrollbar">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border border-white/8 bg-[#0B0E13]/60 rounded-3xl min-h-[200px]">
                    <AlertCircle className="h-10 w-10 text-accent opacity-35 mb-2 animate-pulse" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">No reports match filters</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={cn(
                        "group relative flex flex-col gap-2.5 rounded-2xl border p-4 cursor-pointer transition-all duration-200",
                        selectedReportId === report.id
                          ? "border-accent/40 bg-accent/[0.03]"
                          : "border-white/5 bg-[#0B0E13]/40 hover:bg-white/5 hover:border-white/10"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-xs sm:text-sm line-clamp-1 text-white group-hover:text-accent transition-colors duration-200">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          {getSeverityBadge(report.severity)}
                          {getStatusBadge(report.status)}
                        </div>
                      </div>

                      <p className="text-[11px] text-[#A0AEC0] line-clamp-2 leading-relaxed">
                        {report.summary || report.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground tracking-wide mt-1 pt-2 border-t border-white/5">
                        <span className="truncate max-w-[200px]">{report.address}</span>
                        <span className="uppercase">{format(new Date(report.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Detail Pane: lg=7 */}
            <div className={`lg:col-span-7 ${!selectedReportId ? "hidden lg:flex" : "flex"} flex-col w-full`}>
              <AnimatePresence mode="wait">
                {!selectedReport ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-1 flex-col items-center justify-center border border-white/8 rounded-3xl bg-[#0B0E13]/60 p-12 text-center min-h-[450px]"
                  >
                    <Building className="h-12 w-12 text-accent opacity-30 mb-3 animate-pulse" />
                    <h3 className="text-base font-black text-white uppercase tracking-wider">No report selected</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mt-1.5 leading-relaxed">
                      Select an incident report from the operations log to assign departments, update dispatches, and log internal notes.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedReport.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="flex flex-1 flex-col border border-white/8 rounded-3xl bg-[#0B0E13]/60 overflow-hidden shadow-2xl"
                  >
                    {/* Mobile Back Header */}
                    <div className="flex items-center gap-2 border-b border-white/5 p-4 lg:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReportId(null)}
                        className="h-8 gap-1.5 pl-1.5 rounded-full hover:bg-white/5 text-white text-xs font-bold uppercase tracking-wider"
                      >
                        <ArrowLeft className="h-4 w-4 text-accent" />
                        Back to list
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[750px] p-6 space-y-6 no-scrollbar">
                      {/* Title & Metadata Header */}
                      <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {getSeverityBadge(selectedReport.severity)}
                          {getStatusBadge(selectedReport.status)}
                          {selectedReport.department_id && (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-300 border-blue-500/20 font-bold text-[9px] uppercase tracking-wider">
                              {departments.find((d) => d.id === selectedReport.department_id)?.name || "Assigned"}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-lg md:text-xl font-black tracking-tight text-white leading-snug">{selectedReport.title}</h2>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                          Submitted by citizen on {format(new Date(selectedReport.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>

                      {/* Photo image and Description split */}
                      <div className="grid gap-5 md:grid-cols-12">
                        {selectedReport.image_url && (
                          <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/8 md:col-span-5 bg-[#050608]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedReport.image_url}
                              alt={selectedReport.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className={`space-y-3 ${selectedReport.image_url ? "md:col-span-7" : "md:col-span-12"}`}>
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">User Description</h4>
                          <p className="text-xs text-[#A0AEC0] leading-relaxed font-medium">
                            {selectedReport.description}
                          </p>
                          {selectedReport.ai_summary && (
                            <div className="mt-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-[11px] leading-relaxed">
                              <span className="font-extrabold text-accent block mb-1 uppercase tracking-wide text-[10px]">AI Classification summary</span>
                              {selectedReport.ai_summary}
                            </div>
                          )}
                        </div>
                      </div>

                      <hr className="border-white/5" />

                      {/* ── Operational Control Grid ── */}
                      <div className="grid gap-5 md:grid-cols-2">
                        {/* Department selection */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                            Department Routing
                          </label>
                          <Select
                            defaultValue={selectedReport.department_id || "unassigned"}
                            onValueChange={(val) => {
                              const depId = val === "unassigned" ? null : val
                              departmentMutation.mutate({ id: selectedReport.id, depId })
                            }}
                          >
                            <SelectTrigger className="w-full h-10 rounded-xl bg-white/4 border border-white/8 text-white focus:ring-accent" placeholder="Unassigned">
                              {departments.find((d) => d.id === selectedReport.department_id)?.name || "Unassigned"}
                            </SelectTrigger>
                            <SelectContent className="glass-panel border-white/8 text-white rounded-xl">
                              <SelectItem value="unassigned" className="focus:bg-white/5 focus:text-white rounded-lg">Unassigned</SelectItem>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id} className="focus:bg-white/5 focus:text-white rounded-lg">
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Lifecycle update actions */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                            Lifecycle Dispatches
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedReport.status === "pending" && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider px-4"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "assigned" })}
                              >
                                Mark Assigned
                              </Button>
                            )}
                            {(selectedReport.status === "pending" || selectedReport.status === "assigned") && (
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full bg-white/5 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-wider px-4"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "in_progress" })}
                              >
                                <Play className="mr-1 h-3 w-3 text-accent fill-accent" />
                                Start Work
                              </Button>
                            )}
                            {selectedReport.status === "in_progress" && (
                              <Button
                                variant="default"
                                size="sm"
                                className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-[10px] uppercase tracking-wider px-4"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "resolved" })}
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                Resolve Issue
                              </Button>
                            )}
                            {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="rounded-full bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/25 font-bold text-[10px] uppercase tracking-wider px-4"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "dismissed" })}
                              >
                                <XCircle className="mr-1 h-3.5 w-3.5 shrink-0" />
                                Dismiss
                              </Button>
                            )}
                            {(selectedReport.status === "resolved" || selectedReport.status === "dismissed") && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full bg-white/5 hover:bg-white/10 border-white/10 text-white font-bold text-[10px] uppercase tracking-wider px-4"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "in_progress" })}
                              >
                                Re-open (In Progress)
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <hr className="border-white/5" />

                      {/* Tabs: Notes & Log history */}
                      <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="w-full grid grid-cols-2 bg-white/4 border border-white/8 rounded-full p-0.5">
                          <TabsTrigger value="timeline" className="flex items-center gap-1.5 justify-center rounded-full text-[10px] font-black uppercase tracking-wider py-1.5 data-[state=active]:bg-white/5 data-[state=active]:text-white">
                            <History className="h-3.5 w-3.5 text-accent" />
                            Timeline Log
                          </TabsTrigger>
                          <TabsTrigger value="notes" className="flex items-center gap-1.5 justify-center rounded-full text-[10px] font-black uppercase tracking-wider py-1.5 data-[state=active]:bg-white/5 data-[state=active]:text-white">
                            <MessageSquare className="h-3.5 w-3.5 text-accent" />
                            Internal Notes
                          </TabsTrigger>
                        </TabsList>

                        {/* Timeline logs */}
                        <TabsContent value="timeline" className="pt-4">
                          {isLoadingEvents ? (
                            <div className="py-8 text-center text-[11px] font-bold text-muted-foreground uppercase">Loading dispatch log...</div>
                          ) : events.length === 0 ? (
                            <div className="py-8 text-center text-[11px] font-bold text-muted-foreground uppercase">No events logged</div>
                          ) : (
                            <div className="relative border-l border-white/10 pl-4 ml-2.5 space-y-4 py-2">
                              {events.map((event) => (
                                <div key={event.id} className="relative">
                                  <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-accent glow-accent" />
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                      <span>{format(new Date(event.created_at), "MMM d, h:mm a")}</span>
                                      <span className="text-white font-black">{event.user_name}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-white mt-1 leading-normal">{event.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        {/* Admin Notes */}
                        <TabsContent value="notes" className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Log internal operations note here..."
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="min-h-16 text-xs rounded-xl border border-white/8 bg-white/4 focus:ring-accent"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                disabled={noteMutation.isPending}
                                onClick={() => noteMutation.mutate({ id: selectedReport.id, note: noteText })}
                                className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-[10px] uppercase tracking-wider px-4 h-8 gap-1.5"
                              >
                                <Send className="h-3 w-3" />
                                Save Note
                              </Button>
                            </div>
                          </div>

                          {isLoadingNotes ? (
                            <div className="py-8 text-center text-[11px] font-bold text-muted-foreground uppercase">Loading internal notes...</div>
                          ) : notes.length === 0 ? (
                            <div className="py-8 text-center text-[11px] font-bold text-muted-foreground uppercase">No internal dispatches recorded</div>
                          ) : (
                            <div className="space-y-3 max-h-52 overflow-y-auto pr-1 no-scrollbar">
                              {notes.map((note) => (
                                <div key={note.id} className="p-3.5 rounded-2xl border border-white/5 bg-white/2 text-xs space-y-1.5">
                                  <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-muted-foreground">
                                    <span className="text-white font-black">{note.author_name}</span>
                                    <span>{format(new Date(note.created_at), "MMM d, h:mm a")}</span>
                                  </div>
                                  <p className="text-[#A0AEC0] leading-relaxed text-xs font-medium">{note.note}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>
                      </Tabs>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="mt-6">
          <div className="grid gap-6 md:grid-cols-12 items-start">
            {/* Announcement composer */}
            <div className="md:col-span-5 space-y-4">
              <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 space-y-5 shadow-2xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Broadcast Alert</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Broadcast emergency notifications to all citizens
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Title</label>
                    <Input
                      placeholder="e.g. Critical Water Main Burst"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Alert Message</label>
                    <Textarea
                      placeholder="Write the announcement description..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="min-h-[100px] rounded-xl border border-white/8 bg-white/4 focus:ring-accent text-xs"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Severity</label>
                      <Select
                        value={annSeverity}
                        onValueChange={(val) => setAnnSeverity(val as any)}
                      >
                        <SelectTrigger className="w-full h-10 rounded-xl bg-white/4 border border-white/8 text-white focus:ring-accent">
                          {annSeverity}
                        </SelectTrigger>
                        <SelectContent className="glass-panel border-white/8 text-white rounded-xl">
                          <SelectItem value="Info" className="focus:bg-white/5 focus:text-white rounded-lg">Info</SelectItem>
                          <SelectItem value="Warning" className="focus:bg-white/5 focus:text-white rounded-lg">Warning</SelectItem>
                          <SelectItem value="Emergency" className="focus:bg-white/5 focus:text-white rounded-lg">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Expiration (Hours)</label>
                      <Input
                        type="number"
                        placeholder="Hours"
                        value={annExpiresHrs}
                        onChange={(e) => setAnnExpiresHrs(e.target.value)}
                        min={1}
                      />
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={broadcastMutation.isPending}
                    className="w-full gap-2 mt-2 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground font-bold uppercase tracking-wider text-xs h-10 shrink-0 shadow-lg shadow-accent/20"
                  >
                    <Send className="h-4 w-4" />
                    {broadcastMutation.isPending ? "Broadcasting..." : "Broadcast Alert"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Broadcast log logs */}
            <div className="md:col-span-7 space-y-4">
              <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 p-6 space-y-4 shadow-2xl">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Broadcast Archive</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Currently visible and past notifications
                  </p>
                </div>

                <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto pr-1 no-scrollbar">
                  {adminAnnouncements.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold text-muted-foreground uppercase">
                      No announcements broadcasted yet.
                    </div>
                  ) : (
                    adminAnnouncements.map((a) => {
                      const isExpired = a.expires_at && new Date(a.expires_at) < new Date()
                      return (
                        <div key={a.id} className="py-4.5 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                          <div className="space-y-1.5 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-white leading-tight">{a.title}</span>
                              <Badge
                                variant={
                                  a.severity === "Emergency"
                                    ? "destructive"
                                    : a.severity === "Warning"
                                    ? "warning"
                                    : "outline"
                                }
                                className="text-[9px] font-black uppercase tracking-wider px-2 h-4.5"
                              >
                                {a.severity}
                              </Badge>
                              {isExpired && (
                                <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider px-2 h-4.5 bg-white/5 text-muted-foreground">
                                  Expired
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">{a.content}</p>
                            
                            <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex gap-3.5 pt-1.5">
                              <span>Sent: {format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                              {a.expires_at && (
                                <span>Expires: {format(new Date(a.expires_at), "MMM d, h:mm a")}</span>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-muted-foreground hover:text-red-400 shrink-0 hover:bg-red-500/10 h-8 w-8"
                            onClick={() => deleteAnnouncementMutation.mutate(a.id)}
                            disabled={deleteAnnouncementMutation.isPending}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
