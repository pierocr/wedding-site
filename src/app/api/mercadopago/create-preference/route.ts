// app/api/mercadopago/create-preference/route.ts
import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";
import type { PreferenceCreateData } from "mercadopago/dist/clients/preference/create/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Body = {
  name?: string;
  email?: string;
  title: string;
  amount: number;
  currency?: "CLP" | "USD" | "ARS" | string;
  siteUrl?: string; // si no viene, usamos NEXT_PUBLIC_SITE_URL o el origin del request
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Falta MP_ACCESS_TOKEN en las variables de entorno" },
        { status: 500 }
      );
    }

    const rawTitle = (body?.title ?? "").toString();
    const title = rawTitle.slice(0, 250);
    const amount = Math.round(Number(body?.amount || 0)); // CLP entero

    if (!title || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Título o monto inválido" },
        { status: 400 }
      );
    }

    const fallbackOrigin = new URL(req.url).origin;
    const siteUrl =
      body?.siteUrl || process.env.NEXT_PUBLIC_SITE_URL || fallbackOrigin;

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const externalRef = `gift_${Date.now()}`;

    // Tipamos SOLO el body usando el tipo del SDK
    const prefBody: PreferenceCreateData["body"] = {
      items: [
        {
          id: externalRef, // requerido por los tipos actuales
          title,
          quantity: 1,
          unit_price: amount,
          currency_id: body?.currency || "CLP",
        },
      ],
      payer: {
        name: body?.name,
        email: body?.email || undefined,
      },
      metadata: {
        origin: "wedding-site",
        externalRef,
      },
      external_reference: externalRef,
      back_urls: {
        success: `${siteUrl}/pago/resultado?status=approved`,
        pending: `${siteUrl}/pago/resultado?status=pending`,
        failure: `${siteUrl}/pago/resultado?status=failure`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/mercadopago/webhook`,
      statement_descriptor: "Boda Debby & Piero",
    };

    const pref = await preference.create({ body: prefBody });

    return NextResponse.json({
      id: pref.id,
      init_point: pref.init_point,
      sandbox_init_point: pref.sandbox_init_point,
    });
  } catch (err: any) {
    console.error("MP create-preference error:", err?.message || err);
    return NextResponse.json(
      { error: "No se pudo crear la preferencia" },
      { status: 500 }
    );
  }
}