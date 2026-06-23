export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          image_url: string
          category: string
          severity: string
          confidence: number
          summary: string
          status: string
          latitude: number
          longitude: number
          address: string
          created_at: string
          department: string | null
          tags: string[] | null
          ai_summary: string | null
          embedding: string | null
          department_id: string | null
          resolved_at: string | null
          assigned_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description: string
          image_url: string
          category: string
          severity: string
          confidence: number
          summary: string
          status?: string
          latitude: number
          longitude: number
          address: string
          created_at?: string
          department?: string | null
          tags?: string[] | null
          ai_summary?: string | null
          embedding?: string | null
          department_id?: string | null
          resolved_at?: string | null
          assigned_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          image_url?: string
          category?: string
          severity?: string
          confidence?: number
          summary?: string
          status?: string
          latitude?: number
          longitude?: number
          address?: string
          created_at?: string
          department?: string | null
          tags?: string[] | null
          ai_summary?: string | null
          embedding?: string | null
          department_id?: string | null
          resolved_at?: string | null
          assigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'reports_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      votes: {
        Row: {
          id: string
          user_id: string
          report_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'votes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'votes_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
        ]
      }
      comments: {
        Row: {
          id: string
          user_id: string
          report_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string
          content?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'comments_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'comments_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
        ]
      }
      report_verifications: {
        Row: {
          id: string
          user_id: string
          report_id: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string
          verified?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_verifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_verifications_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
        ]
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: []
      }
      report_events: {
        Row: {
          id: string
          report_id: string
          user_id: string | null
          event_type: string
          from_status: string | null
          to_status: string | null
          description: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id?: string | null
          event_type: string
          from_status?: string | null
          to_status?: string | null
          description: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string | null
          event_type?: string
          from_status?: string | null
          to_status?: string | null
          description?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_events_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'report_events_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      admin_notes: {
        Row: {
          id: string
          report_id: string
          user_id: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          report_id: string
          user_id: string
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          report_id?: string
          user_id?: string
          note?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_notes_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'admin_notes_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          report_id: string | null
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_id?: string | null
          title: string
          message: string
          type: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_id?: string | null
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notifications_report_id_fkey'
            columns: ['report_id']
            isOneToOne: false
            referencedRelation: 'reports'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'notifications_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      announcements: {
        Row: {
          id: string
          title: string
          content: string
          severity: string
          created_at: string
          expires_at: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          severity: string
          created_at?: string
          expires_at?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          severity?: string
          created_at?: string
          expires_at?: string | null
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      user_presence: {
        Row: {
          id: string
          user_id: string
          status: string
          last_seen_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: string
          last_seen_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          status?: string
          last_seen_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      reports_with_stats: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          image_url: string
          category: string
          severity: string
          confidence: number
          summary: string
          status: string
          latitude: number
          longitude: number
          address: string
          created_at: string
          department: string | null
          tags: string[] | null
          ai_summary: string | null
          embedding: string | null
          department_id: string | null
          resolved_at: string | null
          assigned_at: string | null
          vote_count: number
          comment_count: number
          verification_count: number
          trust_score: number
          trending_score: number
        }
        Insert: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          image_url?: string
          category?: string
          severity?: string
          confidence?: number
          summary?: string
          status?: string
          latitude?: number
          longitude?: number
          address?: string
          created_at?: string
          department?: string | null
          tags?: string[] | null
          ai_summary?: string | null
          embedding?: string | null
          department_id?: string | null
          resolved_at?: string | null
          assigned_at?: string | null
          vote_count?: number
          comment_count?: number
          verification_count?: number
          trust_score?: number
          trending_score?: number
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string
          image_url?: string
          category?: string
          severity?: string
          confidence?: number
          summary?: string
          status?: string
          latitude?: number
          longitude?: number
          address?: string
          created_at?: string
          department?: string | null
          tags?: string[] | null
          ai_summary?: string | null
          embedding?: string | null
          department_id?: string | null
          resolved_at?: string | null
          assigned_at?: string | null
          vote_count?: number
          comment_count?: number
          verification_count?: number
          trust_score?: number
          trending_score?: number
        }
        Relationships: [
          {
            foreignKeyName: 'reports_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      user_leaderboard: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          reports_count: number
          verifications_count: number
          votes_count: number
          score: number
        }
        Insert: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          reports_count?: number
          verifications_count?: number
          votes_count?: number
          score?: number
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          reports_count?: number
          verifications_count?: number
          votes_count?: number
          score?: number
        }
        Relationships: []
      }
    }
    Functions: {
      match_reports: {
        Args: {
          query_embedding: string
          match_threshold: number
          max_distance_meters: number
          input_lat: number
          input_lng: number
        }
        Returns: {
          id: string
          title: string
          description: string
          image_url: string
          category: string
          severity: string
          status: string
          latitude: number
          longitude: number
          address: string
          distance_meters: number
          similarity: number
        }[]
      }
      search_reports_semantic: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          title: string
          description: string
          image_url: string
          category: string
          severity: string
          status: string
          latitude: number
          longitude: number
          address: string
          similarity: number
        }[]
      }
    }
    Enums: { [key: string]: never }
    CompositeTypes: { [key: string]: never }
  }
}
