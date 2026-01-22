// Maneja POST de Flow y reescribe GET hacia la página interna
import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  // Reescribe a la página React ubicada en /pago/resultado/view
  const dest = new URL(`/pago/resultado/view${url.search}`, req.url);
  return NextResponse.rewrite(dest);
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
    `/pago/resultado${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    req.url
  );
  return NextResponse.redirect(dest, 303);
}
