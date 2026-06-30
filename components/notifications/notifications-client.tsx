'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Bell, BellOff, Check, MessageSquare, RefreshCw, Settings } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { getNotifications } from "@/lib/notifications/get-notifications"
import { markNotificationAsRead } from "@/lib/notifications/mark-read"
import { markAllNotificationsAsRead } from "@/lib/notifications/mark-all-read"
import type { Notification } from "@/types/community"

interface NotificationsClientProps {
  initialNotifications: Notification[]
}

export function NotificationsClient({
  initialNotifications,
}: NotificationsClientProps) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    initialData: initialNotifications,
  })

  // Mutation to mark single notification as read
  const readMutation = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previous = queryClient.getQueryData<Notification[]>(["notifications"])
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        (old || []).map((n) => (n.id === id ? { ...n, read: true } : n))
      )
      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous)
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  // Mutation to mark all notifications as read
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["notifications"] })
      const previous = queryClient.getQueryData<Notification[]>(["notifications"])
      queryClient.setQueryData<Notification[]>(["notifications"], (old) =>
        (old || []).map((n) => ({ ...n, read: true }))
      )
      return { previous }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notifications"], context.previous)
      }
    },
    onSuccess: () => {
      toast.success("All notifications marked as read")
      void queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      void readMutation.mutate(n.id)
    }
    if (n.report_id) {
      router.push(`/report/${n.report_id}`)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "comment":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20 shrink-0">
            <MessageSquare className="h-4 w-4" />
          </span>
        )
      case "status_change":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <RefreshCw className="h-4 w-4" />
          </span>
        )
      case "department_assignment":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
            <Settings className="h-4 w-4" />
          </span>
        )
      default:
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-white/75 border border-white/10 shrink-0">
            <Bell className="h-4 w-4" />
          </span>
        )
    }
  }

  return (
    <div className="glass-card rounded-3xl border border-white/8 bg-[#0B0E13]/60 overflow-hidden shadow-2xl shadow-black/30 max-w-2xl mx-auto my-6">
      <div className="flex items-center justify-between p-6 border-b border-white/5">
        <div className="space-y-1">
          <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            Civic Inbox
          </h2>
          <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
            You have {unreadCount} unread alert{unreadCount !== 1 && "s"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="rounded-full bg-accent/10 hover:bg-accent hover:text-accent-foreground text-accent border border-accent/20 font-bold px-4 h-8 text-[11px] uppercase tracking-wider transition-all"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      <div className="divide-y divide-white/5">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[250px]">
            <BellOff className="h-10 w-10 text-accent opacity-30 mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inbox is empty</h3>
            <p className="text-[10px] text-muted-foreground mt-1 max-w-[240px] leading-normal">
              Notifications about your reports, comment responses, and status changes will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex items-start gap-4 p-5 cursor-pointer transition-colors duration-200 ${
                n.read ? "hover:bg-white/5" : "bg-accent/[0.02] hover:bg-accent/[0.04]"
              }`}
            >
              {getNotificationIcon(n.type)}

              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className={`text-xs sm:text-sm truncate leading-tight ${n.read ? "text-[#A0AEC0] font-medium" : "text-white font-black"}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] font-bold text-muted-foreground shrink-0 uppercase tracking-wide">
                    {format(new Date(n.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {n.message}
                </p>
              </div>

              {!n.read && (
                <span className="h-2 w-2 rounded-full bg-accent glow-accent shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
