'use server'

import { createClient } from "@/lib/supabase/server"
import type { LeaderboardUser } from "@/types/community"

export async function getLeaderboard(): Promise<LeaderboardUser[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_leaderboard")
    .select("*")
    .limit(100)

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}
