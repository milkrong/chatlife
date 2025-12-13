export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      characters: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          initial_stage: string | null
          name: string
          prompt: string
          relation: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          initial_stage?: string | null
          name: string
          prompt: string
          relation?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          initial_stage?: string | null
          name?: string
          prompt?: string
          relation?: string | null
        }
        Relationships: []
      }
      life_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "life_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          character_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          sender: string
          thinking_process: string | null
          user_id: string
        }
        Insert: {
          character_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender: string
          thinking_process?: string | null
          user_id: string
        }
        Update: {
          character_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          sender?: string
          thinking_process?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          attributes: Json | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          stage: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          age?: number | null
          attributes?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          stage?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          age?: number | null
          attributes?: Json | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          stage?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_characters: {
        Row: {
          affinity: number | null
          character_id: string
          created_at: string | null
          id: string
          memory_summary: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          affinity?: number | null
          character_id: string
          created_at?: string | null
          id?: string
          memory_summary?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          affinity?: number | null
          character_id?: string
          created_at?: string | null
          id?: string
          memory_summary?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_characters_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_characters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

