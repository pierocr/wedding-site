import "server-only";

import { randomRaffleNumber } from "@/lib/flow";

type SupabaseAdmin = {
  from: (table: string) => any;
};

export async function generateUniqueRaffleNumber(supabase: SupabaseAdmin) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const raffleNumber = randomRaffleNumber();
    const { data, error } = await supabase
      .from("payments")
      .select("id")
      .eq("raffle_number", raffleNumber)
      .maybeSingle();

    if (error) throw error;
    if (!data) return raffleNumber;
  }

  throw new Error("No se pudo generar un número de sorteo único");
}

export function readRaffleNumber(payment: any, meta: Record<string, any>) {
  const value = payment?.raffle_number ?? meta.raffle_number ?? null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 100000 && parsed <= 999999 ? parsed : null;
}
