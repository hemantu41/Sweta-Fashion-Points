import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client for browser/public operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Lead {
  id?: number;
  name: string;
  mobile: string;
  created_at?: string;
  page_visited?: string;
}
