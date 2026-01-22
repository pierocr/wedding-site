export const runtime = "edge";

import { NextResponse } from "next/server";
import { randomRaffleNumber } from "@/lib/flow";
import { sendFlowReceiptEmail } from "@/lib/email/flowReceipt";

type TestBody = {
  to?: string;
  name?: string;
  amount?: number;
  currency?: string;
  message?: string;
  cart?: unknown;
  payment_id?: string;
};

const unauthorized = () =>
  NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

export async function POST(req: Request) {
  const expectedToken = process.env.EMAIL_TEST_TOKEN;
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Missing EMAIL_TEST_TOKEN (misconfiguration)" },
      { status: 500 }
    );
  }

  const headerToken = req.headers.get("x-email-test-token");
  if (!headerToken || headerToken !== expectedToken) {
    return unauthorized();
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { ok: false, error: "Missing RESEND_API_KEY (misconfiguration)" },
      { status: 500 }
    );
  }

  const senderEnv = process.env.EMAIL_FROM || process.env.THANKS_FROM;
  if (!senderEnv) {
    return NextResponse.json(
      { ok: false, error: "Missing EMAIL_FROM/THANKS_FROM (misconfiguration)" },
      { status: 500 }
    );
  }

  let body: TestBody = {};
  try {
    body = ((await req.json()) || {}) as TestBody;
  } catch {
    body = {};
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  if (!to) {
    return NextResponse.json({ ok: false, error: "Field 'to' is required" }, { status: 400 });
  }

  if (body.cart !== undefined && !Array.isArray(body.cart)) {
    return NextResponse.json({ ok: false, error: "Field 'cart' must be an array" }, { status: 400 });
  }

  const donorName =
    typeof body.name === "string" && body.name.trim().length ? body.name.trim() : "Test";
  const amount =
    typeof body.amount === "number" && !Number.isNaN(body.amount) ? body.amount : 1000;
  const currency =
    typeof body.currency === "string" && body.currency.trim().length
      ? body.currency.trim().toUpperCase()
      : "CLP";
  const message = typeof body.message === "string" ? body.message : null;
  const cart = Array.isArray(body.cart) ? body.cart : null;
  const paymentId =
    typeof body.payment_id === "string" && body.payment_id.trim().length
      ? body.payment_id.trim()
      : `test_postman_${Date.now()}`;

  try {
    const result = await sendFlowReceiptEmail({
      donor_name: donorName,
      donor_email: to,
      amount,
      raffle_number: randomRaffleNumber(),
      external_reference: paymentId,
      flow_order: null,
      flow_token: null,
      cart,
      message,
    });

    return NextResponse.json({
      ok: true,
      id: result?.id || null,
      fromUsed: result?.from,
      to: result?.to?.[0] || to,
      subject: result?.subject || `Comprobante de regalo – ${currency}`,
    });
  } catch (err: any) {
    const status = err?.status || 502;
    const details = err?.details || err?.message || "Resend error";
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Resend error",
        status,
        details,
      },
      { status: 502 }
    );
  }
}
