import { Trophy, Award, Medal, Users } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getLeaderboard } from "@/lib/leaderboard/get-leaderboard"

export const dynamic = "force-dynamic"

function getInitials(name?: string | null) {
  if (!name) return "CQ"
  return name
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export default async function LeaderboardPage() {
  const users = await getLeaderboard()
  const topThree = users.slice(0, 3)

  const podiumOrder = [
    { item: topThree[1], place: 2, badgeColor: "bg-neutral-300 text-neutral-800 border-neutral-400/20", icon: Medal, height: "h-36" }, // 2nd
    { item: topThree[0], place: 1, badgeColor: "bg-amber-400 text-amber-950 border-amber-500/20", icon: Trophy, height: "h-44 border-2 border-amber-500/40" }, // 1st
    { item: topThree[2], place: 3, badgeColor: "bg-amber-650 text-amber-900 border-amber-700/20", icon: Award, height: "h-32" }, // 3rd
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-500 bg-clip-text text-transparent dark:from-white dark:to-neutral-400">
          Citizen Leaderboard
        </h1>
        <p className="text-muted-foreground">
          Recognizing citizens who actively report and verify local infrastructure issues.
        </p>
      </div>

      {users.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center border bg-card min-h-[350px]">
          <Users className="h-12 w-12 text-muted-foreground opacity-30 mb-3" />
          <CardTitle className="text-lg">No activity yet</CardTitle>
          <CardDescription className="max-w-sm mt-1">
            Be the first to report or verify issues to kickstart the civic operations leaderboard!
          </CardDescription>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* ── Podium for Top 3 ── */}
          <div className="flex flex-col items-center justify-center sm:flex-row gap-4 pt-4 max-w-2xl mx-auto">
            {podiumOrder.map(({ item, place, badgeColor, icon: Icon, height }) => {
              if (!item) return null
              const name = item.full_name || "Citizen"
              return (
                <div
                  key={item.id}
                  className={`flex flex-col items-center justify-end rounded-xl border bg-card/60 p-5 text-center shadow-sm w-full sm:w-48 ${height}`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarImage src={item.avatar_url || undefined} alt={name} />
                      <AvatarFallback>{getInitials(name)}</AvatarFallback>
                    </Avatar>
                    <span className={`absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-bold ${badgeColor}`}>
                      {place}
                    </span>
                  </div>
                  <div className="mt-3 w-full">
                    <h3 className="font-semibold text-xs truncate max-w-40">{name}</h3>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-bold text-foreground">{item.score} pts</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Full Rankings Table ── */}
          <Card className="bg-card shadow-sm border">
            <CardHeader className="p-6">
              <CardTitle className="text-md">Operational Ranking</CardTitle>
              <CardDescription>Points formula: Reports × 10 + Verifications × 5 + Votes × 2</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">Rank</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="text-center">Reports Filed</TableHead>
                    <TableHead className="text-center">Verifications</TableHead>
                    <TableHead className="text-center">Votes Cast</TableHead>
                    <TableHead className="text-right pr-6">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((item, index) => {
                    const name = item.full_name || "Citizen"
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-bold text-xs text-muted-foreground">
                          #{index + 1}
                        </TableCell>
                        <TableCell className="flex items-center gap-3">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={item.avatar_url || undefined} alt={name} />
                            <AvatarFallback className="text-[10px]">{getInitials(name)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-xs sm:text-sm">{name}</span>
                        </TableCell>
                        <TableCell className="text-center text-xs">{item.reports_count}</TableCell>
                        <TableCell className="text-center text-xs">{item.verifications_count}</TableCell>
                        <TableCell className="text-center text-xs">{item.votes_count}</TableCell>
                        <TableCell className="text-right pr-6 font-bold text-xs sm:text-sm text-primary">
                          {item.score} pts
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
