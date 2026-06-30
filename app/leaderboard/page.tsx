import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client"

export const dynamic = "force-dynamic"

export default function LeaderboardPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">
          Citizen Trust Leaderboard
        </h1>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Recognizing citizens who actively report and verify local infrastructure issues to build communal trust.
        </p>
      </div>

      <LeaderboardClient />
    </div>
  )
}
