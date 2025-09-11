import { NextResponse } from "next/server";
export const runtime = "edge";
export async function GET() {
  const pick = (k: string) => (process.env[k] ? true : false);
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: pick("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE: pick("SUPABASE_SERVICE_ROLE"),
    MP_ACCESS_TOKEN: pick("MP_ACCESS_TOKEN"),
    MP_WEBHOOK_SECRET: pick("MP_WEBHOOK_SECRET"),
    NEXT_PUBLIC_SITE_URL: pick("NEXT_PUBLIC_SITE_URL"),
  });
}
