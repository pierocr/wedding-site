export const runtime = process.env.NODE_ENV === "development" ? "nodejs" : "edge";

export async function GET() {
  const hasToken = !!process.env.MP_ACCESS_TOKEN;
  return new Response(
    JSON.stringify({ hasToken, env: process.env.NODE_ENV }),
    { headers: { "content-type": "application/json" } }
  );
}
