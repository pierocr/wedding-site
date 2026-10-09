import "server-only";

import { cookies } from "next/headers";

export const DASHBOARD_COOKIE_NAME = "wedding_dashboard_access";
export const DASHBOARD_COOKIE_MAX_AGE = 60 * 60 * 12;

export function getDashboardAccessCode() {
  return (
    process.env.DASHBOARD_ACCESS_CODE || process.env.ADMIN_ACCESS_CODE || ""
  );
}

function getSessionSecret() {
  return (
    process.env.DASHBOARD_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    "dashboard-session"
  );
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashDashboardCode(code: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(code));
  return toHex(signature);
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
}

export async function hasDashboardAccess() {
  const code = getDashboardAccessCode();
  if (!code) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(DASHBOARD_COOKIE_NAME)?.value || "";
  return safeEqual(session, await hashDashboardCode(code));
}
