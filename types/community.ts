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

export type ReportStatus = 'pending' | 'in_progress' | 'resolved'

export interface FeedFilters {
  category: ReportCategory | 'all'
  severity: ReportSeverity | 'all'
  status: ReportStatus | 'all'
  search: string
}

export interface FeedPage {
  reports: ReportWithStats[]
  nextCursor: string | null
}
