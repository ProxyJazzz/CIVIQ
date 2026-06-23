import { getNotifications } from "@/lib/notifications/get-notifications"
import { NotificationsClient } from "@/components/notifications/notifications-client"

export const dynamic = "force-dynamic"

export default async function NotificationsPage() {
  const notifications = await getNotifications()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-500 bg-clip-text text-transparent dark:from-white dark:to-neutral-400">
          Notifications Center
        </h1>
        <p className="text-muted-foreground">
          Stay updated on your reported issues, comments, and status assignments.
        </p>
      </div>

      <NotificationsClient initialNotifications={notifications} />
    </div>
  )
}
