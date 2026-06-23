import { getAnalyticsSummary } from "@/lib/analytics/get-analytics"
import { AnalyticsClient } from "@/components/analytics/analytics-client"

export const dynamic = "force-dynamic"

export default async function AnalyticsPage() {
  const data = await getAnalyticsSummary()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-500 bg-clip-text text-transparent dark:from-white dark:to-neutral-400">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Real-time metrics, categories distribution, and operational performance charts.
        </p>
      </div>

      <AnalyticsClient data={data} />
    </div>
  )
}
