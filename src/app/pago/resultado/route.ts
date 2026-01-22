// Maneja POST de Flow y reescribe GET hacia la página interna
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Proxy hacia la página React ubicada en /pago/resultado/view sin usar rewrite (no soportado en route handlers)
  const dest = new URL("/pago/resultado/view", req.url);
  dest.search = new URL(req.url).search;
  return fetch(dest.toString(), {
    headers: req.headers,
  });
}

export async function POST(req: Request) {
  let token: string | null = null;
  try {
    const form = await req.formData();
    token = form.get("token") ? String(form.get("token")) : null;
  } catch {
    token = null;
  }

  const dest = new URL(
    `/pago/resultado${
      token ? `?token=${encodeURIComponent(token)}` : "?error=missing_token"
    }`,
    req.url
  );
  return NextResponse.redirect(dest, 303);
}
