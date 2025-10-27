import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

export const supabaseInitializationError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Configuration Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in your environment variables.'
    : null;

// Initialize the client only if the keys are provided.
// The app will handle the case where supabase is null.
export const supabase = supabaseInitializationError
  ? null
  : createClient<Database>(supabaseUrl!, supabaseAnonKey!);