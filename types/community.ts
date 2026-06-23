import type { Database } from '@/types/database'

export type Report = Database['public']['Tables']['reports']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
export type Verification = Database['public']['Tables']['report_verifications']['Row']

/** Report enriched with community aggregates — returned by the feed query */
export interface ReportWithStats extends Report {
  vote_count: number
  comment_count: number
  verification_count: number
  trust_score: number
  trending_score: number
  /** Whether the requesting user has voted (null when not authenticated) */
  user_has_voted: boolean
  /** Whether the requesting user has verified (null when not authenticated) */
  user_has_verified: boolean
}

/** Comment enriched with author profile */
export interface CommentWithAuthor extends Comment {
  author: {
    full_name: string | null
    avatar_url: string | null
  }
}

export interface TrustScore {
  score: number
  label: 'Low Trust' | 'Medium Trust' | 'High Trust'
}

export type ReportCategory =
  | 'Pothole'
  | 'Garbage'
  | 'Water Leakage'
  | 'Streetlight'
  | 'Road Damage'
  | 'Drainage'
  | 'Other'

export type ReportSeverity = 'Low' | 'Medium' | 'High'

export type ReportStatus = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'dismissed'

export type Department = Database['public']['Tables']['departments']['Row']
export type ReportEvent = Database['public']['Tables']['report_events']['Row']
export type AdminNote = Database['public']['Tables']['admin_notes']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type LeaderboardUser = Database['public']['Views']['user_leaderboard']['Row']

export interface FeedFilters {
  category: ReportCategory | 'all'
  severity: ReportSeverity | 'all'
  status: ReportStatus | 'all'
  search: string
  sortBy?: 'newest' | 'trending' | 'trust'
}

export interface FeedPage {
  reports: ReportWithStats[]
  nextCursor: string | null
}

export type Announcement = Database['public']['Tables']['announcements']['Row']
export type UserPresence = Database['public']['Tables']['user_presence']['Row']

export interface ActivePresence {
  user_id: string
  status: 'online' | 'offline' | 'away'
  last_seen_at: string
  full_name?: string | null
  avatar_url?: string | null
}

