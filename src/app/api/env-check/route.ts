import { NextResponse } from "next/server";
import { PAYMENT_CONFIG } from "@/config/payment";

export const runtime = "edge";
export async function GET() {
  const pick = (k: string) => (process.env[k] ? true : false);
  const flowConfigEnv = PAYMENT_CONFIG.flowEnvironment;
  const expectedFlowApiUrl =
    flowConfigEnv === "sandbox" ? "https://sandbox.flow.cl/api" : "https://www.flow.cl/api";
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: pick("NEXT_PUBLIC_SUPABASE_URL"),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: pick("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    SUPABASE_SERVICE_ROLE: pick("SUPABASE_SERVICE_ROLE"),
    SUPABASE_SERVICE_ROLE_KEY: pick("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_URL: pick("SUPABASE_URL"),
    FLOW_ENV: process.env.FLOW_ENV || null,
    FLOW_CONFIG_ENV: flowConfigEnv,
    FLOW_EXPECTED_API_URL: expectedFlowApiUrl,
    FLOW_API_KEY: pick("FLOW_API_KEY"),
    FLOW_SECRET_KEY: pick("FLOW_SECRET_KEY"),
    FLOW_PRODUCTION_API_KEY: pick("FLOW_PRODUCTION_API_KEY"),
    FLOW_PRODUCTION_SECRET_KEY: pick("FLOW_PRODUCTION_SECRET_KEY"),
    FLOW_SANDBOX_API_KEY: pick("FLOW_SANDBOX_API_KEY"),
    FLOW_SANDBOX_SECRET_KEY: pick("FLOW_SANDBOX_SECRET_KEY"),
    FLOW_API_URL_LEGACY_IGNORED: pick("FLOW_API_URL"),
    FLOW_PRODUCTION_API_URL: pick("FLOW_PRODUCTION_API_URL"),
    FLOW_SANDBOX_API_URL: pick("FLOW_SANDBOX_API_URL"),
    BASE_URL: pick("BASE_URL"),
    NEXT_PUBLIC_SITE_URL: pick("NEXT_PUBLIC_SITE_URL"),
  });
}
