import "server-only";

const encoder = new TextEncoder();

export async function hashRsvpEditSecret(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function createRsvpEditCode() {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return String(100_000 + (value[0] % 900_000));
}

export function createRsvpEditToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`;
}
