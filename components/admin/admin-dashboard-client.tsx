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

import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
    <div className="space-y-6">
      <Tabs defaultValue="operations" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b">
          <TabsList>
            <TabsTrigger value="operations">Report Operations</TabsTrigger>
            <TabsTrigger value="announcements">Emergency Announcements</TabsTrigger>
          </TabsList>
          <div className="text-xs text-muted-foreground">
            Logged in as Admin &middot; Real-time Active
          </div>
        </div>

        <TabsContent value="operations" className="space-y-6 mt-6">
          {/* ── Metric Summary Cards ── */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
            <Card className="bg-background border shadow-sm">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-medium text-muted-foreground uppercase">Total</span>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{counts.total}</div>
              </CardContent>
            </Card>
            <Card className="bg-background border shadow-sm">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-medium text-neutral-500 uppercase">Pending</span>
                <Clock className="h-4 w-4 text-neutral-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-neutral-500">{counts.pending}</div>
              </CardContent>
            </Card>
            <Card className="bg-background border shadow-sm">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-medium text-sky-500 uppercase">Assigned</span>
                <Building className="h-4 w-4 text-sky-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-sky-500">{counts.assigned}</div>
              </CardContent>
            </Card>
            <Card className="bg-background border shadow-sm">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-medium text-amber-500 uppercase">In Progress</span>
                <Play className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-amber-500">{counts.inProgress}</div>
              </CardContent>
            </Card>
            <Card className="bg-background border shadow-sm">
              <CardHeader className="p-4 flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-medium text-emerald-500 uppercase">Resolved</span>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold text-emerald-500">{counts.resolved}</div>
              </CardContent>
            </Card>
          </div>

          {/* ── Operational Dual Pane ── */}
          <div className="grid gap-6 lg:grid-cols-12 min-h-[600px]">
            {/* Left list pane: lg=5 */}
            <div className={`space-y-4 lg:col-span-5 ${selectedReportId ? "hidden lg:block" : "block"}`}>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Status pills */}
                <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none max-w-full">
                  {statusFilters.map((filter) => (
                    <Button
                      key={filter.value}
                      variant={statusFilter === filter.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(filter.value)}
                      className="rounded-full text-xs whitespace-nowrap"
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-card">
                    <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">No reports match filters.</p>
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => setSelectedReportId(report.id)}
                      className={`group relative flex flex-col gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 ${
                        selectedReportId === report.id
                          ? "border-primary bg-primary/[0.03] dark:bg-primary/[0.01]"
                          : "bg-card hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-sm line-clamp-1 group-hover:underline">
                          {report.title}
                        </h3>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {getSeverityBadge(report.severity)}
                          {getStatusBadge(report.status)}
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {report.summary || report.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
                        <span className="truncate max-w-[200px]">{report.address}</span>
                        <span>{format(new Date(report.created_at), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right detail pane: lg=7 */}
            <div className={`lg:col-span-7 ${!selectedReportId ? "hidden lg:flex" : "flex"} flex-col`}>
              <AnimatePresence mode="wait">
                {!selectedReport ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-1 flex-col items-center justify-center border rounded-xl bg-card p-12 text-center"
                  >
                    <Building className="h-12 w-12 text-muted-foreground opacity-40 mb-3" />
                    <h3 className="text-lg font-semibold">No report selected</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                      Select a report from the list to assign departments, update statuses, and log internal notes.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedReport.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-1 flex-col border rounded-xl bg-card overflow-hidden"
                  >
                    {/* Mobile Back Header */}
                    <div className="flex items-center gap-2 border-b p-4 lg:hidden">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedReportId(null)}
                        className="h-8 gap-1 pl-1"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to list
                      </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[750px] p-6 space-y-6">
                      {/* Title & Metadata */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {getSeverityBadge(selectedReport.severity)}
                          {getStatusBadge(selectedReport.status)}
                          {selectedReport.department_id && (
                            <Badge variant="outline" className="bg-sky-500/10 text-sky-500 border-sky-500/20">
                              {departments.find((d) => d.id === selectedReport.department_id)?.name || "Assigned"}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-xl font-bold tracking-tight">{selectedReport.title}</h2>
                        <p className="text-xs text-muted-foreground">
                          Submitted by user on {format(new Date(selectedReport.created_at), "MMMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>

                      {/* Image and Description */}
                      <div className="grid gap-4 md:grid-cols-12">
                        {selectedReport.image_url && (
                          <div className="relative aspect-video rounded-lg overflow-hidden border md:col-span-5 bg-muted">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={selectedReport.image_url}
                              alt={selectedReport.title}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        <div className={`space-y-2 ${selectedReport.image_url ? "md:col-span-7" : "md:col-span-12"}`}>
                          <h4 className="text-xs font-semibold uppercase text-muted-foreground">User Description</h4>
                          <p className="text-sm text-foreground leading-relaxed">
                            {selectedReport.description}
                          </p>
                          {selectedReport.ai_summary && (
                            <div className="mt-3 p-3 rounded-lg bg-neutral-500/5 border border-neutral-500/10 text-xs">
                              <span className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">AI Summarization:</span>
                              {selectedReport.ai_summary}
                            </div>
                          )}
                        </div>
                      </div>

                      <hr className="border-border" />

                      {/* ── Operations Area ── */}
                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Department assignment */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground block">
                            Department Assignment
                          </label>
                          <Select
                            defaultValue={selectedReport.department_id || "unassigned"}
                            onValueChange={(val) => {
                              const depId = val === "unassigned" ? null : val
                              departmentMutation.mutate({ id: selectedReport.id, depId })
                            }}
                          >
                            <SelectTrigger className="w-full" placeholder="Unassigned">
                              {departments.find((d) => d.id === selectedReport.department_id)?.name || "Unassigned"}
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Unassigned</SelectItem>
                              {departments.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Status lifecycle actions */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase text-muted-foreground block">
                            Lifecycle Actions
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedReport.status === "pending" && (
                              <Button
                                variant="secondary"
                                size="sm"
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
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "in_progress" })}
                              >
                                <Play className="mr-1.5 h-3.5 w-3.5" />
                                Start Work
                              </Button>
                            )}
                            {selectedReport.status === "in_progress" && (
                              <Button
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "resolved" })}
                              >
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Resolve Issue
                              </Button>
                            )}
                            {selectedReport.status !== "resolved" && selectedReport.status !== "dismissed" && (
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "dismissed" })}
                              >
                                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                                Dismiss
                              </Button>
                            )}
                            {(selectedReport.status === "resolved" || selectedReport.status === "dismissed") && (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={statusMutation.isPending}
                                onClick={() => statusMutation.mutate({ id: selectedReport.id, status: "in_progress" })}
                              >
                                Re-open (In Progress)
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <hr className="border-border" />

                      {/* Tabs: Notes & Timeline */}
                      <Tabs defaultValue="timeline" className="w-full">
                        <TabsList className="w-full grid grid-cols-2">
                          <TabsTrigger value="timeline" className="flex items-center gap-1.5 justify-center">
                            <History className="h-4 w-4" />
                            Timeline
                          </TabsTrigger>
                          <TabsTrigger value="notes" className="flex items-center gap-1.5 justify-center">
                            <MessageSquare className="h-4 w-4" />
                            Admin Notes
                          </TabsTrigger>
                        </TabsList>

                        {/* Timeline Tab content */}
                        <TabsContent value="timeline" className="pt-2">
                          {isLoadingEvents ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">Loading timeline...</div>
                          ) : events.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">No events recorded.</div>
                          ) : (
                            <div className="relative border-l pl-4 ml-2 space-y-4 py-2">
                              {events.map((event) => (
                                <div key={event.id} className="relative">
                                  <span className="absolute -left-[21px] top-1.5 flex h-2 w-2 rounded-full bg-primary" />
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                      <span>{format(new Date(event.created_at), "MMM d, yyyy h:mm a")}</span>
                                      <span className="font-medium text-foreground">{event.user_name}</span>
                                    </div>
                                    <p className="text-xs font-semibold text-foreground mt-0.5">{event.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </TabsContent>

                        {/* Admin Notes Tab content */}
                        <TabsContent value="notes" className="space-y-4 pt-2">
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Type internal operational note..."
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              className="min-h-16 text-xs"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                disabled={noteMutation.isPending}
                                onClick={() => noteMutation.mutate({ id: selectedReport.id, note: noteText })}
                                className="gap-1.5 text-xs h-8"
                              >
                                <Send className="h-3 w-3" />
                                Save Note
                              </Button>
                            </div>
                          </div>

                          {isLoadingNotes ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">Loading notes...</div>
                          ) : notes.length === 0 ? (
                            <div className="py-8 text-center text-xs text-muted-foreground">No internal notes written yet.</div>
                          ) : (
                            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                              {notes.map((note) => (
                                <div key={note.id} className="p-3 rounded-lg border bg-neutral-500/5 text-xs space-y-1">
                                  <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span className="font-semibold text-foreground">{note.author_name}</span>
                                    <span>{format(new Date(note.created_at), "MMM d, yyyy h:mm a")}</span>
                                  </div>
                                  <p className="text-foreground leading-relaxed text-xs">{note.note}</p>
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
          <div className="grid gap-6 md:grid-cols-12">
            {/* Left Pane: Composer Form */}
            <div className="md:col-span-5 space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <h3 className="font-semibold text-sm">Broadcast New Alert</h3>
                  <p className="text-xs text-muted-foreground">
                    Send emergency broadcasts or information alerts to all active citizens.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Title</label>
                    <Input
                      placeholder="e.g. Water Outage Alert"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase text-muted-foreground">Content Message</label>
                    <Textarea
                      placeholder="Detail the announcement..."
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Severity</label>
                      <Select
                        value={annSeverity}
                        onValueChange={(val) => setAnnSeverity(val as any)}
                      >
                        <SelectTrigger className="w-full">
                          {annSeverity}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Info">Info</SelectItem>
                          <SelectItem value="Warning">Warning</SelectItem>
                          <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase text-muted-foreground">Expires In (Hours)</label>
                      <Input
                        type="number"
                        placeholder="Hours (optional)"
                        value={annExpiresHrs}
                        onChange={(e) => setAnnExpiresHrs(e.target.value)}
                        min={1}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleCreateAnnouncement}
                    disabled={broadcastMutation.isPending}
                    className="w-full gap-2 mt-2"
                  >
                    <Send className="h-4 w-4" />
                    {broadcastMutation.isPending ? "Broadcasting..." : "Broadcast Alert"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Pane: History / List */}
            <div className="md:col-span-7 space-y-4">
              <Card>
                <CardHeader className="pb-4">
                  <h3 className="font-semibold text-sm">Active & Broadcast History</h3>
                  <p className="text-xs text-muted-foreground">
                    Currently visible and past notifications sent to the system.
                  </p>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {adminAnnouncements.length === 0 ? (
                      <div className="py-12 text-center text-sm text-muted-foreground">
                        No announcements broadcasted yet.
                      </div>
                    ) : (
                      adminAnnouncements.map((a) => {
                        const isExpired = a.expires_at && new Date(a.expires_at) < new Date()
                        return (
                          <div key={a.id} className="p-4 flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm">{a.title}</span>
                                <Badge
                                  variant={
                                    a.severity === "Emergency"
                                      ? "destructive"
                                      : a.severity === "Warning"
                                      ? "warning"
                                      : "outline"
                                  }
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  {a.severity}
                                </Badge>
                                {isExpired && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Expired
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{a.content}</p>
                              <div className="text-[10px] text-muted-foreground flex gap-3 pt-1">
                                <span>Sent: {format(new Date(a.created_at), "MMM d, h:mm a")}</span>
                                {a.expires_at && (
                                  <span>Expires: {format(new Date(a.expires_at), "MMM d, h:mm a")}</span>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-muted-foreground hover:text-red-400 shrink-0"
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
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
