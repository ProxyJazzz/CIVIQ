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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
