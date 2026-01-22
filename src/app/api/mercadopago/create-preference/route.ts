// src/app/api/mercadopago/create-preference/route.ts
// ⚠️ Legacy (Flow es el nuevo flujo). Se mantiene para historial, no usar en UI nueva.
export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

/* ---------------------- utils ---------------------- */
function env(k: string, opts?: { optional?: boolean; fallback?: string }) {
  const v = process.env[k] ?? opts?.fallback;
  if (!opts?.optional && (v === undefined || v === null || v === "")) {
    throw new Error(`Missing env ${k}`);
  }
  return v as string | undefined;
}

/** "Nombre Apellido Apellido" -> { first:"Nombre", last:"Apellido Apellido" } */
function splitName(full: string) {
  const parts = String(full || "").trim().split(/\s+/);
  const first = parts.shift() || "";
  const last = parts.join(" ") || "-";
  return { first, last };
}

/** Limpia emojis al principio del título (algunos métodos de pago son exigentes) */
function stripLeadingEmoji(s: string) {
  return String(s || "")
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji}\uFE0F\s]+/u, "")
    .trim();
}

/* ---------------------- handler ---------------------- */
export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      cart?: Array<{
        id: string;
        title: string;
        unitPrice: number;
        qty: number;
        description?: string;
      }>;
      currency?: string; // default CLP
      external_reference?: string;
    };

    const {
      name = "",
      email = "",
      cart = [],
      currency = "CLP",
      external_reference,
    } = body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json({ error: "Carrito vacío o inválido" }, { status: 400 });
    }

    // ---------- envs ----------
    const ACCESS_TOKEN = env("MP_ACCESS_TOKEN"); // prueba en preview, real en prod
    const SITE_URL =
      env("SITE_URL", { optional: true }) ||
      env("NEXT_PUBLIC_SITE_URL", { optional: true }) ||
      "http://localhost:3000";

    // webhook final: MP_WEBHOOK_URL (si está) o SITE_URL + secret si existe
    const WEBHOOK =
      env("MP_WEBHOOK_URL", { optional: true }) ||
      `${SITE_URL}/api/mercadopago/webhook${
        env("MP_WEBHOOK_SECRET", { optional: true }) ? `?secret=${env("MP_WEBHOOK_SECRET")}` : ""
      }`;

    // ---------- items ----------
    const items = cart.map((l) => {
      const cleanTitle = stripLeadingEmoji(l.title);
      const description =
        l.description ||
        (String(l.id || "").startsWith("custom:")
          ? `Regalo personalizado`
          : `Regalo de boda — ${cleanTitle || "Detalle"}`);

      return {
        id: String(l.id || cleanTitle || "gift"),
        title: cleanTitle || "Regalo",
        description,
        quantity: Number(l.qty) || 1,
        currency_id: currency || "CLP",
        unit_price: Number(l.unitPrice) || 0,
      };
    });

    const { first, last } = splitName(name);

    // ---------- preference payload ----------
    const preference: Record<string, any> = {
      items,
      payer: {
        name: first,
        surname: last,
        email: String(email || "").trim() || undefined,
      },
      back_urls: {
        success: `${SITE_URL}/pago?status=success`,
        failure: `${SITE_URL}/pago?status=failure`,
        pending: `${SITE_URL}/pago?status=pending`,
      },
      auto_return: "approved",
      external_reference:
        external_reference ||
        `gift:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      notification_url: WEBHOOK,
      statement_descriptor: "Piero&Debby", // máx 22 chars, opcional
      metadata: {
        site: SITE_URL,
        cart_len: items.length,
      },
    };

    // ---------- call MP ----------
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
      redirect: "follow",
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`MercadoPago error ${res.status}: ${txt || res.statusText}`);
    }

    const data = await res.json();
    const init_point: string | undefined = data.init_point || data.sandbox_init_point;
    if (!init_point) throw new Error("No se recibió init_point de Mercado Pago");

    const is_sandbox = Boolean(data.sandbox_init_point);

    return NextResponse.json({
      id: data.id,
      init_point,
      is_sandbox,
    });
  } catch (err: any) {
    console.error("[MP:create-preference] ", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
