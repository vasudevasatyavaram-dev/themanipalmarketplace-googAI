import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types';

const supabaseUrl = 'https://ynxkqcerupuzybmgdlvl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlueGtxY2VydXB1enlibWdkbHZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MTU3OTgsImV4cCI6MjA3Njk5MTc5OH0.QlbqaVIBNxCB30ESnZQXBqrYQkLEwEFSovC0pnWP62U';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
