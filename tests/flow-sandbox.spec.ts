import { expect, request, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function loadEnvLocal() {
  const file = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(file)) return;

  for (const rawLine of fs.readFileSync(file, "utf8").split(/\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const idx = rawLine.indexOf("=");
    if (idx === -1) continue;

    const key = rawLine.slice(0, idx).trim();
    const value = rawLine.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const publicBaseUrl = (process.env.BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
const localBaseUrl = process.env.LOCAL_BASE_URL || "http://localhost:3000";

test.describe("Flow sandbox readiness", () => {
  test("public tunnel is reachable without tunnel authentication", async ({ request }) => {
    test.skip(!publicBaseUrl || publicBaseUrl.includes("localhost"), "BASE_URL must be a public tunnel URL");

    const response = await request.get(`${publicBaseUrl}/api/env-check`, {
      failOnStatusCode: false,
      timeout: 20_000,
    });

    expect(
      response.status(),
      [
        `Expected public BASE_URL to be reachable by Flow: ${publicBaseUrl}`,
        "If this is 401 with 'www-authenticate: tunnel', the dev tunnel is private/authenticated.",
        "Make the tunnel public/anonymous before testing Flow webhooks.",
      ].join("\n")
    ).toBe(200);

    const contentType = response.headers()["content-type"] || "";
    expect(
      contentType,
      [
        `Expected /api/env-check to return JSON from Next, got '${contentType || "no content-type"}'.`,
        "If the body is HTML, the tunnel is serving an auth/interstitial page instead of your app.",
      ].join("\n")
    ).toContain("application/json");

    const env = await response.json();
    expect(env.FLOW_CONFIG_ENV).toBe("sandbox");
    expect(env.FLOW_SANDBOX_API_KEY).toBe(true);
    expect(env.FLOW_SANDBOX_SECRET_KEY).toBe(true);
  });

  test("local app creates a Flow sandbox payment order", async () => {
    test.skip(process.env.RUN_FLOW_SANDBOX_E2E !== "1", "Set RUN_FLOW_SANDBOX_E2E=1 to create a sandbox order");

    const api = await request.newContext({
      baseURL: localBaseUrl,
    });

    const response = await api.post("/api/flow/create-payment", {
      data: {
        donor_name: "Playwright Sandbox",
        donor_email: "pierocr@gmail.com",
        message: "Prueba automatizada sandbox Flow",
        cart: [
          {
            id: "playwright-sandbox",
            title: "Prueba sandbox Playwright",
            unitPrice: 1000,
            qty: 1,
          },
        ],
        amount: 1000,
        currency: "CLP",
      },
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    expect(body.redirectUrl).toContain("sandbox.flow.cl");
    expect(body.redirectUrl).toContain("token=");
    expect(body.external_reference).toMatch(/^GIFT_\d{8}_[A-F0-9]{8}$/);
    expect(body.payment_id).toBeTruthy();
  });
});
