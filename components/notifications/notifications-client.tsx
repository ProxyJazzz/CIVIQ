'use client'

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { Bell, BellOff, Check, MessageSquare, RefreshCw, Settings } from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
            <MessageSquare className="h-4 w-4" />
          </span>
        )
      case "status_change":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <RefreshCw className="h-4 w-4" />
          </span>
        )
      case "department_assignment":
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 shrink-0">
            <Settings className="h-4 w-4" />
          </span>
        )
      default:
        return (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-500/10 text-neutral-500 border border-neutral-500/20 shrink-0">
            <Bell className="h-4 w-4" />
          </span>
        )
    }
  }

  return (
    <Card className="bg-card shadow-sm border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-6 border-b">
        <div>
          <CardTitle className="text-md flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Inbox
          </CardTitle>
          <CardDescription>
            You have {unreadCount} unread notification{unreadCount !== 1 && "s"}
          </CardDescription>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => readAllMutation.mutate()}
            disabled={readAllMutation.isPending}
            className="h-8 text-xs font-semibold"
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-0 divide-y">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground min-h-[250px]">
            <BellOff className="h-10 w-10 text-muted-foreground opacity-30 mb-2" />
            <p className="text-sm font-medium">Your inbox is empty.</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Notifications about your reports and comments will appear here.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`flex items-start gap-4 p-4 cursor-pointer transition-colors duration-200 ${
                n.read ? "hover:bg-muted/20" : "bg-primary/[0.02] dark:bg-primary/[0.005] hover:bg-primary/[0.04]"
              }`}
            >
              {getNotificationIcon(n.type)}

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-xs sm:text-sm ${n.read ? "text-foreground/80 font-medium" : "text-foreground font-semibold"}`}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {format(new Date(n.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                  {n.message}
                </p>
              </div>

              {!n.read && (
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 self-center" />
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
