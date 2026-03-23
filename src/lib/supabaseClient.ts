// src/lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js";

let supabaseClient: ReturnType<typeof createClient> | null = null;

function env(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}. Define it in .env.local before using the RSVP form.`);
  }
  return value;
}

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createClient(
    env("NEXT_PUBLIC_SUPABASE_URL"),
    env("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );

  return supabaseClient;
}
