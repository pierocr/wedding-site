import { NextResponse } from "next/server";

import { sendAbandonedCartEmails } from "@/lib/email/abandonedCart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_RECIPIENT = "pierocr@gmail.com";

function isAuthorized(request: Request) {
  const secret = process.env.EMAIL_TEST_TOKEN;
  const bearer = request.headers.get("authorization");
  return Boolean(secret) && bearer === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const status = body?.status === "rejected" || body?.status === "cancelled" ? body.status : "pending";
  const result = await sendAbandonedCartEmails({
    paymentId: null,
    donorName: "Piero (prueba)",
    donorEmail: TEST_RECIPIENT,
    amount: 120000,
    cart: [{ title: "Cena a la Luz de las Velas", qty: 1, unitPrice: 120000 }],
    externalReference: "TEST_ABANDONED_CART",
    status,
    retryUrl: `${(process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://pieroydebby.cl").replace(/\/$/, "")}/#regalo`,
  }, { sendInternal: false });
  return NextResponse.json({ ok: true, sent_to: TEST_RECIPIENT, result });
}
