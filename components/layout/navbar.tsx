'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ExitIcon, PersonIcon } from "@radix-ui/react-icons"
import { Map, Radio, Activity, Trophy, BarChart2, Shield, Bell } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { usePresence } from "@/hooks/usePresence"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase/client"

function getInitials(name?: string | null, email?: string | null) {
  const label = name || email || "CIVIQ"
  return label
    .split(/[ @._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")
}

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<{ role: string } | null>(null)

  const fullName = user?.user_metadata.full_name as string | undefined
  const avatarUrl = user?.user_metadata.avatar_url as string | undefined

  const { onlineCount } = usePresence(
    user?.id ?? null,
    user
      ? {
          full_name: fullName ?? null,
          avatar_url: avatarUrl ?? null,
        }
      : null
  )

  // Fetch profile to verify role
  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }

    const userId = user.id
    const supabase = createClient()
    async function fetchProfile() {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single()
      if (data) {
        setProfile(data)
      }
    }
    void fetchProfile()
  }, [user])

  // Poll for unread notification count
  const { data: notificationBadge = [] } = useQuery({
    queryKey: ["notifications-badge", user?.id],
    queryFn: async () => {
      if (!user) return []
      const supabase = createClient()
      const { data } = await supabase
        .from("notifications")
        .select("id, read")
        .eq("user_id", user.id)
      return data || []
    },
    enabled: !!user,
    refetchInterval: 10000, // check count every 10 seconds
  })

  const unreadCount = notificationBadge.filter((n) => !n.read).length

  async function handleSignOut() {
    await signOut()
    router.push("/auth")
    router.refresh()
  }

  const linkActiveClasses = (path: string) =>
    pathname.startsWith(path)
      ? "bg-neutral-500/10 text-foreground"
      : "text-muted-foreground hover:text-foreground"

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75 sticky top-0 z-40">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-bold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-600 bg-clip-text text-transparent dark:from-white dark:to-neutral-400">
            CIVIQ
          </Link>
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span>{onlineCount}</span>
          </div>
        </div>

        {/* ── Desktop Navigation ── */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link
            href="/feed"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${linkActiveClasses(
              "/feed"
            )}`}
          >
            <Radio className="h-3.5 w-3.5" />
            Feed
          </Link>
          <Link
            href="/map"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${linkActiveClasses(
              "/map"
            )}`}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </Link>
          <Link
            href="/trending"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${linkActiveClasses(
              "/trending"
            )}`}
          >
            <Activity className="h-3.5 w-3.5" />
            Trending
          </Link>
          <Link
            href="/leaderboard"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${linkActiveClasses(
              "/leaderboard"
            )}`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </Link>
          <Link
            href="/analytics"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${linkActiveClasses(
              "/analytics"
            )}`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </Link>
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${linkActiveClasses(
                "/admin"
              )}`}
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          )}
        </div>

        {/* ── Actions Menu & Notifications ── */}
        <nav aria-label="Primary navigation" className="flex items-center gap-3">
          {loading ? (
            <div className="h-9 w-20 rounded-md bg-muted" />
          ) : user ? (
            <>
              {/* Notifications bell icon */}
              <Link
                href="/notifications"
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors hover:bg-muted ${
                  pathname === "/notifications" ? "bg-muted" : "bg-transparent"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-sm animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 gap-2 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatarUrl} alt={fullName || user.email || "CIVIQ user"} />
                      <AvatarFallback>{getInitials(fullName, user.email)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden max-w-32 truncate text-sm md:inline">
                      {fullName || user.email}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <PersonIcon className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* Mobile Admin Link */}
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild className="md:hidden">
                      <Link href="/admin">
                        <Shield className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {/* Mobile Links */}
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/feed">
                      <Radio className="mr-2 h-4 w-4" />
                      Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/map">
                      <Map className="mr-2 h-4 w-4" />
                      Map
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/trending">
                      <Activity className="mr-2 h-4 w-4" />
                      Trending
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/leaderboard">
                      <Trophy className="mr-2 h-4 w-4" />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="md:hidden">
                    <Link href="/analytics">
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <ExitIcon className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  )
}
