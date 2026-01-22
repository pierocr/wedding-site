import "server-only";
import { createClient } from "@supabase/supabase-js";

function env(k: string, opts?: { fallback?: string }) {
  const v = process.env[k] ?? opts?.fallback;
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

/**
 * Cliente de Supabase con SERVICE ROLE (solo servidor).
 * ¡No lo importes en componentes client!
 */
export function getSupabaseAdmin() {
  return createClient(
    env("NEXT_PUBLIC_SUPABASE_URL", { fallback: process.env.SUPABASE_URL }),
    env("SUPABASE_SERVICE_ROLE", { fallback: process.env.SUPABASE_SERVICE_ROLE_KEY }),
    { auth: { persistSession: false } }
  );
}
