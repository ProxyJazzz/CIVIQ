'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ExitIcon, PersonIcon } from "@radix-ui/react-icons"
import { Map, Radio, Activity, Trophy, BarChart2, Shield, Bell, PlusCircle } from "lucide-react"

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
    <header className="sticky top-4 z-50 w-full max-w-6xl mx-auto px-4 my-2">
      <div className="glass-panel rounded-full px-5 md:px-6 h-14 flex items-center justify-between shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-lg font-black tracking-tighter text-white hover:opacity-90 transition-opacity">
            CIVIQ<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/40 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            <span>{onlineCount} active</span>
          </div>
        </div>

        {/* ── Desktop Navigation ── */}
        <div className="hidden md:flex items-center gap-1">
          <Link
            href="/feed"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${linkActiveClasses(
              "/feed"
            )}`}
          >
            <Radio className="h-3.5 w-3.5" />
            Feed
          </Link>
          <Link
            href="/report"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold tracking-wide transition-all duration-300 ${
              pathname.startsWith("/report")
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)] font-black"
                : "text-emerald-400/80 hover:text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/10 hover:shadow-[0_0_8px_rgba(16,185,129,0.15)]"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Report
          </Link>
          <Link
            href="/map"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${linkActiveClasses(
              "/map"
            )}`}
          >
            <Map className="h-3.5 w-3.5" />
            Map
          </Link>
          <Link
            href="/trending"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${linkActiveClasses(
              "/trending"
            )}`}
          >
            <Activity className="h-3.5 w-3.5" />
            Trending
          </Link>
          <Link
            href="/leaderboard"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${linkActiveClasses(
              "/leaderboard"
            )}`}
          >
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </Link>
          <Link
            href="/analytics"
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${linkActiveClasses(
              "/analytics"
            )}`}
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Analytics
          </Link>
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${linkActiveClasses(
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
            <div className="h-8 w-16 rounded-full bg-muted animate-pulse" />
          ) : user ? (
            <>
              {/* Notifications bell */}
              <Link
                href="/notifications"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 hover:bg-white/5 ${
                  pathname === "/notifications"
                    ? "bg-white/10 text-white border-white/20"
                    : "bg-transparent text-muted-foreground border-transparent"
                }`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2 rounded-full bg-accent glow-accent" />
                )}
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 gap-2 px-1.5 rounded-full hover:bg-white/5 text-white">
                    <div className="relative">
                      <Avatar className="h-7 w-7 border border-white/10">
                        <AvatarImage src={avatarUrl} alt={fullName || user.email || "CIVIQ user"} />
                        <AvatarFallback className="bg-muted text-foreground text-[10px]">
                          {getInitials(fullName, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent border border-background" />
                    </div>
                    <span className="hidden max-w-28 truncate text-xs font-semibold md:inline tracking-wide">
                      {fullName || user.email?.split("@")[0]}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 glass-panel border border-white/8 text-white mt-1 shadow-2xl rounded-2xl p-1.5">
                  <DropdownMenuLabel className="px-2.5 py-2 text-xs font-bold text-muted-foreground truncate">
                    {user.email}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/8 my-1" />
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2">
                    <Link href="/profile" className="flex items-center text-xs font-medium w-full">
                      <PersonIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {/* Mobile Admin Link */}
                  {profile?.role === "admin" && (
                    <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                      <Link href="/admin" className="flex items-center text-xs font-medium w-full">
                        <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {/* Mobile Links */}
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                    <Link href="/report" className="flex items-center text-xs font-medium w-full text-emerald-400">
                      <PlusCircle className="mr-2 h-4 w-4 text-emerald-400" />
                      Report Issue
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                    <Link href="/feed" className="flex items-center text-xs font-medium w-full">
                      <Radio className="mr-2 h-4 w-4 text-muted-foreground" />
                      Feed
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                    <Link href="/map" className="flex items-center text-xs font-medium w-full">
                      <Map className="mr-2 h-4 w-4 text-muted-foreground" />
                      Map
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                    <Link href="/trending" className="flex items-center text-xs font-medium w-full">
                      <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                      Trending
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                    <Link href="/leaderboard" className="flex items-center text-xs font-medium w-full">
                      <Trophy className="mr-2 h-4 w-4 text-muted-foreground" />
                      Leaderboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-xl focus:bg-white/5 focus:text-white cursor-pointer px-2.5 py-2 md:hidden">
                    <Link href="/analytics" className="flex items-center text-xs font-medium w-full">
                      <BarChart2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      Analytics
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/8 my-1" />
                  <DropdownMenuItem onClick={handleSignOut} className="rounded-xl focus:bg-destructive/10 focus:text-destructive cursor-pointer px-2.5 py-2">
                    <ExitIcon className="mr-2 h-4 w-4 text-destructive/80" />
                    <span className="text-xs font-medium">Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button asChild size="sm" className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-4 py-1 text-xs">
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </nav>
      </div>
      {user && (
        <div className="fixed bottom-6 right-6 z-50 md:hidden">
          <Link
            href="/report"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/40 border border-white/10 hover:scale-105 active:scale-95 transition-all duration-200"
            aria-label="Report issue"
          >
            <PlusCircle className="h-6 w-6 animate-pulse" />
          </Link>
        </div>
      )}
    </header>
  )
}
