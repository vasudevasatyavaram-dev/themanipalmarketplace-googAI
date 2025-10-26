import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = "https://kdheuhzuudfejkzexkgs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkaGV1aHp1dWRmZWpremV4a2dzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyODY5MjAsImV4cCI6MjA3Njg2MjkyMH0.yqjX2rO-PzKpj1MPsZPEasKbgvAijQ7VPgjD5trssuI";

let client: SupabaseClient<Database> | null = null;
let error: string | null = null;

try {
  client = createClient<Database>(supabaseUrl, supabaseAnonKey);
} catch (e: any) {
  error = `Failed to initialize Supabase client: ${e.message}`;
  console.error(error);
}

export const supabase = client;
export const supabaseError = error;
