
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          approval_status: string
          category: string[] | null
          created_at: string
          description: string
          id: string
          image_url: string[]
          images: Json[]
          price: number
          product_status: string
          quantity_left: number
          quantity_sold: number
          title: string
          type: string
          user_id: string
          edit_count: number
          reject_explanation: string | null
        }
        Insert: {
          approval_status?: string
          category?: string[] | null
          created_at?: string
          description: string
          id?: string
          image_url: string[]
          images?: Json[]
          price: number
          product_status?: string
          quantity_left: number
          quantity_sold?: number
          title: string
          type: string
          user_id: string
          edit_count?: number
          reject_explanation?: string | null
        }
        Update: {
          approval_status?: string
          category?: string[] | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string[]
          images?: Json[]
          price?: number
          product_status?: string
          quantity_left?: number
          quantity_sold?: number
          title?: string
          type?: string
          user_id?: string
          edit_count?: number
          reject_explanation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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

export type Product = Database["public"]["Tables"]["products"]["Row"];