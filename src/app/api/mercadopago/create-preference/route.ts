// src/app/api/mercadopago/create-preference/route.ts
import { NextResponse } from "next/server";

function env(k: string) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env ${k}`);
  return v;
}

/** Split "Piero Cespedes Romanini" -> {first:"Piero", last:"Cespedes Romanini"} */
function splitName(full: string) {
  const parts = String(full || "").trim().split(/\s+/);
  const first = parts.shift() || "";
  const last = parts.join(" ") || "-";
  return { first, last };
}

// quitar emoji inicial opcionalmente
function stripLeadingEmoji(s: string) {
  return String(s || "").replace(
    /^(\p{Extended_Pictographic}|\p{Emoji_Presentation})\s*/u,
    ""
  );
}

function resolveCategoryId(idOrTitle: string) {
  // Puedes cambiar a "donations" si te gusta más. "others" es segura.
  return "others";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name: string = String(body.name || "");
    const email: string = String(body.email || "");
    const currency: string = String(body.currency || "CLP");
    const title: string = String(body.title || "Regalo");
    const cart: Array<any> = Array.isArray(body.cart) ? body.cart : [];
    const external_reference: string =
      String(body.external_reference || `gift:${Date.now()}`);

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    // ===== Items con description + category_id (requisito del panel) =====
    let items: any[] = [];

    if (cart.length > 0) {
      items = cart.map((l) => {
        const cleanTitle = stripLeadingEmoji(l.title);
        const description =
          l.description ||
          (String(l.id || "").startsWith("custom:")
            ? `Regalo personalizado: ${String(l.id).split(":").slice(1, -1).join(":")}`
            : `Regalo de boda — ${cleanTitle}`);

        return {
          id: String(l.id || cleanTitle || "gift"),
          title: cleanTitle || "Regalo",
          description,                               // ✅ requerido
          category_id: resolveCategoryId(l.id || cleanTitle), // ✅ requerido
          quantity: Number(l.qty || 1),
          currency_id: currency,
          unit_price: Math.round(Number(l.unitPrice || 0)),
        };
      });
    } else {
      // compat: flujo antiguo con un solo monto
      const amount = Number(body.amount || 0);
      if (!amount) {
        return NextResponse.json({ error: "Carrito vacío o amount=0" }, { status: 400 });
      }
      const cleanTitle = stripLeadingEmoji(title);
      items = [
        {
          id: "single_gift",
          title: cleanTitle,
          description: `Regalo de boda — ${cleanTitle}`, // ✅
          category_id: resolveCategoryId(cleanTitle),     // ✅
          quantity: 1,
          currency_id: currency,
          unit_price: Math.round(amount),
        },
      ];
    }

    // ===== Payer con last_name (requisito del panel) =====
    const { first, last } = splitName(name);

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const MP_ACCESS_TOKEN = env("MP_ACCESS_TOKEN");
    const notification_url =
      process.env.MP_WEBHOOK_URL || `${SITE_URL}/api/mercadopago/webhook`;

    const preferencePayload = {
      items,
      payer: {
        email,
        first_name: first,
        last_name: last, // ✅ requerido
      },
      external_reference,
      back_urls: {
        success: `${SITE_URL}/gracias`,
        failure: `${SITE_URL}/pago/resultado?status=failure`,
        pending: `${SITE_URL}/pago/resultado?status=pending`,
      },
      auto_return: "approved",
      notification_url,
      statement_descriptor: "Boda P&D",
    };

    const mpRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const data = await mpRes.json();

    if (!mpRes.ok) {
      console.error("MercadoPago error:", data);
      return NextResponse.json(
        { error: data?.message || "Error en Mercado Pago", details: data },
        { status: mpRes.status }
      );
    }

    return NextResponse.json({
      id: data.id,
      init_point: data.init_point || data.sandbox_init_point,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
