import "server-only";

import { PAYMENT_CONFIG } from "@/config/payment";

export type FlowPaymentStatus = "pending" | "paid" | "rejected" | "cancelled" | "unknown";
export type FlowEnvironment = "production" | "sandbox";

type EnvOpts = { optional?: boolean; fallback?: string | undefined };

function env(k: string, opts?: EnvOpts) {
  const v = process.env[k] ?? opts?.fallback;
  if (!opts?.optional && (v === undefined || v === null || v === "")) {
    throw new Error(`Missing env ${k}`);
  }
  return v as string | undefined;
}

export type FlowConfig = {
  environment: FlowEnvironment;
  apiKey: string;
  secretKey: string;
  apiUrl: string;
  urlConfirmation: string;
  urlReturn: string;
  subject: string;
};

const FLOW_API_URLS: Record<FlowEnvironment, string> = {
  production: "https://www.flow.cl/api",
  sandbox: "https://sandbox.flow.cl/api",
};

function getFlowEnvironment(): FlowEnvironment {
  const raw = (
    env("FLOW_ENV", { optional: true }) ||
    (process.env.NODE_ENV === "production" ? undefined : "sandbox") ||
    PAYMENT_CONFIG.flowEnvironment ||
    "production"
  ).toLowerCase();
  if (raw === "production" || raw === "prod") return "production";
  if (raw === "sandbox" || raw === "test" || raw === "testing") return "sandbox";
  throw new Error(`Invalid FLOW_ENV ${raw}. Use "production" or "sandbox"`);
}

export function getFlowConfig(): FlowConfig {
  const environment = getFlowEnvironment();
  const isSandbox = environment === "sandbox";
  const baseUrl =
    env("BASE_URL", { optional: true }) ||
    env("NEXT_PUBLIC_SITE_URL", { optional: true }) ||
    "http://localhost:3000";

  const apiUrl = (
    isSandbox
      ? env("FLOW_SANDBOX_API_URL", { optional: true })
      : env("FLOW_PRODUCTION_API_URL", { optional: true })
  ) || FLOW_API_URLS[environment];
  const apiKey = isSandbox
    ? env("FLOW_SANDBOX_API_KEY")
    : env("FLOW_PRODUCTION_API_KEY", { optional: true, fallback: process.env.FLOW_API_KEY });
  const secretKey = isSandbox
    ? env("FLOW_SANDBOX_SECRET_KEY")
    : env("FLOW_PRODUCTION_SECRET_KEY", { optional: true, fallback: process.env.FLOW_SECRET_KEY });

  if (!apiKey) throw new Error(`Missing Flow API key for ${environment}`);
  if (!secretKey) throw new Error(`Missing Flow secret key for ${environment}`);

  return {
    environment,
    apiKey,
    secretKey,
    apiUrl: apiUrl.replace(/\/+$/, ""),
    urlConfirmation: `${baseUrl.replace(/\/+$/, "")}/api/flow/webhook`,
    urlReturn: `${baseUrl.replace(/\/+$/, "")}/pago/resultado`,
    subject: "Regalo matrimonio Piero & Debby",
  };
}

function normalizeParams(params: Record<string, string | number | undefined | null>) {
  const cleaned: Record<string, string> = {};
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    cleaned[k] = String(v);
  });
  return cleaned;
}

async function sign(params: Record<string, string | number>, secretKey: string) {
  const sorted = Object.keys(params)
    .filter((k) => k !== "s")
    .sort();
  const payload = sorted.map((k) => `${k}${params[k] ?? ""}`).join("");
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secretKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function flowRequest(
  endpoint: string,
  params: Record<string, string | number | undefined | null>,
  config: FlowConfig,
  opts?: { method?: "GET" | "POST" }
) {
  const method = opts?.method ?? "POST";
  const normalized = normalizeParams({ ...params, apiKey: config.apiKey });
  const s = await sign(normalized as Record<string, string | number>, config.secretKey);
  const payload = { ...normalized, s };
  const search = new URLSearchParams(payload);
  const url = `${config.apiUrl}/${endpoint.replace(/^\/+/, "")}`;

  const res =
    method === "GET"
      ? await fetch(`${url}?${search.toString()}`, { method: "GET" })
      : await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: search.toString(),
        });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg = typeof data === "string" ? data : data?.message || data?.error || res.statusText;
    throw new Error(`Flow ${endpoint} ${res.status}: ${msg}`);
  }

  if (data && typeof data === "object" && "code" in data) {
    const code = Number((data as any).code);
    if (!Number.isNaN(code) && code !== 0 && code !== 200 && code !== 201) {
      const msg = (data as any).message || "Flow API error";
      throw new Error(`Flow ${endpoint} code ${code}: ${msg}`);
    }
  }

  return data;
}

export async function createFlowPayment(input: {
  commerceOrder: string;
  subject?: string;
  amount: number;
  email: string;
  urlConfirmation?: string;
  urlReturn?: string;
  optional?: Record<string, string | number | null | undefined>;
}) {
  const config = getFlowConfig();
  const payload = {
    commerceOrder: input.commerceOrder,
    subject: input.subject || config.subject,
    amount: input.amount,
    email: input.email,
    urlConfirmation: input.urlConfirmation || config.urlConfirmation,
    urlReturn: input.urlReturn || config.urlReturn,
    ...(input.optional || {}),
  };

  const data = await flowRequest("payment/create", payload, config, { method: "POST" });
  if (!data?.url || !data?.token) {
    throw new Error("Flow create payment sin url o token");
  }

  return {
    url: data.url as string,
    token: data.token as string,
    flowOrder: data.flowOrder || data.flow_order || null,
    raw: data,
  };
}

export function normalizeFlowStatus(code: any): FlowPaymentStatus {
  const c = Number(code);
  if (Number.isNaN(c)) return "unknown";
  if (c === 1) return "pending";
  if (c === 2) return "paid";
  if (c === 3) return "rejected";
  if (c === 4) return "cancelled";
  return "unknown";
}

export async function fetchFlowStatus(token: string) {
  const config = getFlowConfig();
  let data: any = null;
  try {
    data = await flowRequest(
      "payment/getStatusExtended",
      { token },
      config,
      { method: "GET" }
    );
  } catch (err) {
    // fallback a getStatus
    data = await flowRequest("payment/getStatus", { token }, config, { method: "GET" });
  }

  const statusCode =
    data?.status ??
    data?.currentStatus ??
    data?.paymentData?.status ??
    data?.payment?.status ??
    null;

  const commerceOrder =
    data?.commerceOrder ??
    data?.orderNumber ??
    data?.paymentData?.commerceOrder ??
    data?.payment?.commerceOrder ??
    null;

  const flowOrder =
    data?.flowOrder ??
    data?.paymentData?.flowOrder ??
    data?.payment?.flowOrder ??
    data?.payment?.id ??
    null;

  const payer =
    data?.payer ??
    data?.paymentData?.payer ??
    data?.customer ??
    data?.payment?.payer ??
    {};

  const amount =
    Number(data?.amount) ||
    Number(data?.paymentData?.amount) ||
    Number(data?.payment?.amount) ||
    null;

  return {
    raw: data,
    status: normalizeFlowStatus(statusCode),
    statusCode,
    commerceOrder: commerceOrder ? String(commerceOrder) : null,
    flowOrder: flowOrder ? String(flowOrder) : null,
    payerEmail: payer?.email ? String(payer.email) : null,
    payerName: payer?.name ? String(payer.name) : null,
    amount,
  };
}

export function randomRaffleNumber() {
  const min = 100000;
  const range = 900000; // 100000-999999 inclusive
  const maxAcceptable = Math.floor(0xffffffff / range) * range;
  while (true) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    if (buf[0] < maxAcceptable) {
      return min + (buf[0] % range);
    }
  }
}
