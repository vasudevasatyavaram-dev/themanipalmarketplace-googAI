
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
          image_urls: string[]
          original_image_urls: string[] | null
          price: number
          product_status: string
          quantity_left: number
          quantity_sold: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          approval_status?: string
          category?: string[] | null
          created_at?: string
          description: string
          id?: string
          image_urls: string[]
          original_image_urls?: string[] | null
          price: number
          product_status?: string
          quantity_left: number
          quantity_sold?: number
          title: string
          type: string
          user_id: string
        }
        Update: {
          approval_status?: string
          category?: string[] | null
          created_at?: string
          description?: string
          id?: string
          image_urls?: string[]
          original_image_urls?: string[] | null
          price?: number
          product_status?: string
          quantity_left?: number
          quantity_sold?: number
          title?: string
          type?: string
          user_id?: string
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