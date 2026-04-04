export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          email: string | null
          created_at: string
          adventure_style: 'whimsical' | 'realistic' | 'dark'
          difficulty: 'easy' | 'medium' | 'hard'
          dice_preference: 'physical' | 'digital'
          language: 'en' | 'da'
        }
        Insert: {
          id?: string
          email?: string | null
          created_at?: string
          adventure_style?: 'whimsical' | 'realistic' | 'dark'
          difficulty?: 'easy' | 'medium' | 'hard'
          dice_preference?: 'physical' | 'digital'
          language?: 'en' | 'da'
        }
        Update: Partial<Database['public']['Tables']['families']['Insert']>
        Relationships: []
      }
      players: {
        Row: {
          id: string
          family_id: string
          name: string
          age: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          age: number
          color?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['players']['Insert']>
        Relationships: [
          {
            foreignKeyName: "players_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      adventures: {
        Row: {
          id: string
          family_id: string
          name: string
          created_at: string
          last_played_at: string | null
          state: Record<string, unknown>
        }
        Insert: {
          id?: string
          family_id: string
          name?: string
          created_at?: string
          last_played_at?: string | null
          state?: Record<string, unknown>
        }
        Update: Partial<Database['public']['Tables']['adventures']['Insert']>
        Relationships: [
          {
            foreignKeyName: "adventures_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          }
        ]
      }
      characters: {
        Row: {
          id: string
          adventure_id: string
          player_id: string
          name: string
          class: 'warrior' | 'wizard' | 'rogue' | 'ranger'
          gender: 'male' | 'female' | 'neutral'
          created_at: string
        }
        Insert: {
          id?: string
          adventure_id: string
          player_id: string
          name: string
          class: 'warrior' | 'wizard' | 'rogue' | 'ranger'
          gender?: 'male' | 'female' | 'neutral'
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['characters']['Insert']>
        Relationships: [
          {
            foreignKeyName: "characters_adventure_id_fkey"
            columns: ["adventure_id"]
            isOneToOne: false
            referencedRelation: "adventures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "characters_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
