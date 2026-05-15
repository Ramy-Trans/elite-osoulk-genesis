import { createClient } from "@supabase/supabase-js";

// Normalize URL: strip any trailing /rest/v1/ or /rest/v1 that some env configs include
function normalizeUrl(url: string | undefined): string {
  if (!url) return "";
  return url.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
}

const rawUrl      = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseUrl = normalizeUrl(rawUrl);
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (import.meta.env.DEV) {
  console.log("[supabase] URL:", supabaseUrl || "NOT SET");
  console.log("[supabase] Key set:", !!supabaseAnon);
}

if (!supabaseUrl || !supabaseAnon) {
  console.error(
    "[supabase] Missing env vars — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY " +
    "in .env.production (for Hostinger builds) or Replit Secrets (for dev)."
  );
}

// Use placeholder strings when vars are missing so the app MODULE loads
// without crashing — Supabase queries will fail gracefully (401) instead
// of throwing "supabaseUrl is required" and showing a white screen.
export const supabase = createClient(
  supabaseUrl  || "https://placeholder.supabase.co",
  supabaseAnon || "placeholder-anon-key"
);
