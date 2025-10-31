

import { type Crop } from 'react-image-crop';

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
          product_group_id: string
          session: string | null
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
          product_group_id?: string
          session?: string | null
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
          product_group_id?: string
          session?: string | null
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
      report_query: {
        Row: {
          id: number
          created_at: string
          subject: string | null
          body: string
          user_id: string
        }
        Insert: {
          id?: number
          created_at?: string
          subject?: string | null
          body: string
          user_id: string
        }
        Update: {
          id?: number
          created_at?: string
          subject?: string | null
          body?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_query_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          user_id: string
          is_seller: boolean
          created_at: string
        }
        Insert: {
          user_id: string
          is_seller?: boolean
          created_at?: string
        }
        Update: {
          user_id?: string
          is_seller?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      get_latest_products_for_user: {
        Args: {
          p_user_id: string
        }
        Returns: Database["public"]["Tables"]["products"]["Row"][]
      }
      get_groups_with_unapproved_edits: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          product_group_id: string;
          latest_status: string;
          reject_explanation: string | null;
        }[];
      }
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

export type CropMode = 'auto' | 'square' | 'portrait' | 'landscape';

export interface CroppedImage {
  id: string;
  originalFile: File;
  previewUrl: string;
  cropData: Crop;
  cropMode: CropMode;
}

export interface ExistingImage {
    id: string;
    url: string;
}