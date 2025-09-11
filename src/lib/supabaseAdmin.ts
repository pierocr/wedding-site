import "server-only";
import { createClient } from "@supabase/supabase-js";

function env(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

/**
 * Cliente de Supabase con SERVICE ROLE (solo servidor).
 * ¡No lo importes en componentes client!
 */
export function getSupabaseAdmin() {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE"),
    { auth: { persistSession: false } }
  );
}
