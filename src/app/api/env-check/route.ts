import { NextResponse } from "next/server";
export const runtime = "edge";
export async function GET() {
  const pick = (k: string) => (process.env[k] ? true : false);
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: pick("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE: pick("SUPABASE_SERVICE_ROLE"),
    SUPABASE_SERVICE_ROLE_KEY: pick("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_URL: pick("SUPABASE_URL"),
    FLOW_API_KEY: pick("FLOW_API_KEY"),
    FLOW_SECRET_KEY: pick("FLOW_SECRET_KEY"),
    FLOW_API_URL: pick("FLOW_API_URL"),
    BASE_URL: pick("BASE_URL"),
    NEXT_PUBLIC_SITE_URL: pick("NEXT_PUBLIC_SITE_URL"),
  });
}
