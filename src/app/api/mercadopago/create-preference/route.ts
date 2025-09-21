// src/app/api/mercadopago/create-preference/route.ts
import { NextResponse } from "next/server";

function env(k: string, fallback?: string) {
  const v = process.env[k] ?? fallback;
  if (v === undefined || v === null || v === "") {
    throw new Error(`Missing env ${k}`);
  }
  return v;
}

/** "Piero Cespedes Romanini" -> { first:"Piero", last:"Cespedes Romanini" } */
function splitName(full: string) {
  const parts = String(full || "").trim().split(/\s+/);
  const first = parts.shift() || "";
  const last = parts.join(" ") || "-";
  return { first, last };
}

/** Elimina un emoji inicial del título para cumplir con validaciones de MP */
function stripLeadingEmoji(s: string) {
  return String(s || "").replace(
    // rango general de pictogramas/emoji al inicio
    /^[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Emoji}\uFE0F\s]+/u,
    ""
  ).trim();
}

export async function POST(req: Request) {
  try {
    // ---------- Entrada ----------
    const body = await req.json().catch(() => ({}));

    const {
      name = "",
      email = "",
      cart = [] as Array<{
        id: string;
        title: string;
        unitPrice: number;
        qty: number;
        description?: string;
      }>,
      currency = "CLP",
      external_reference,
    } = body || {};

    if (!Array.isArray(cart) || cart.length === 0) {
      return NextResponse.json(
        { error: "Carrito vacío o inválido" },
        { status: 400 }
      );
    }

    const { first, last } = splitName(name);

    // ---------- Configuración ----------
    const ACCESS_TOKEN = env("MP_ACCESS_TOKEN"); // prod o test token
    const SITE_URL = env("SITE_URL", "https://www.pieroydebby.cl");

    // URLs de retorno (tu página Next)
    const back = {
      success: `${SITE_URL}/pago?status=success`,
      failure: `${SITE_URL}/pago?status=failure`,
      pending: `${SITE_URL}/pago?status=pending`,
    };

    // Opcional: webhook para notificaciones (si ya lo tienes)
    const notification_url =
      process.env.MP_WEBHOOK_URL && process.env.MP_WEBHOOK_URL.trim() !== ""
        ? process.env.MP_WEBHOOK_URL
        : undefined;

    // ---------- Ítems ----------
    const items = cart.map((l) => {
      const cleanTitle = stripLeadingEmoji(l.title);
      const description =
        l.description ||
        (String(l.id || "").startsWith("custom:")
          ? `Regalo personalizado: ${String(l.id)
              .split(":")
              .slice(1, -1)
              .join(":")}`
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

    // ---------- Preferencia ----------
    const preference: any = {
      items,
      payer: {
        name: first,
        surname: last,
        email: String(email || "").trim() || undefined,
      },
      back_urls: back,
      auto_return: "approved", // <- clave para volver automáticamente al aprobarse
      external_reference:
        external_reference ||
        `gift:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
      statement_descriptor: "Piero&Debby", // opcional (texto en cartola, máx 22 chars)
      notification_url, // opcional si tienes webhook
      metadata: {
        site: "pieroydebby",
        cart_len: items.length,
      },
    };

    // ---------- Llamada a Mercado Pago ----------
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
      // En Cloudflare/Edge no sigas redirecciones
      redirect: "follow",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(
        `MercadoPago error ${res.status}: ${errText || res.statusText}`
      );
    }

    const data = await res.json();

    // `init_point` (prod) o `sandbox_init_point` (modo test)
    const init_point = data.init_point || data.sandbox_init_point;
    if (!init_point) {
      throw new Error("No se recibió init_point de Mercado Pago");
    }

    return NextResponse.json({
      id: data.id,
      init_point,
    });
  } catch (err: any) {
    console.error("[MP:create-preference] ", err);
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 }
    );
  }
}
