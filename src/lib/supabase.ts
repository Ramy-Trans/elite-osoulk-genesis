import { createClient } from "@supabase/supabase-js";

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnon) {
  console.error("[supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set.");
}

export const supabase = createClient(supabaseUrl, supabaseAnon);
