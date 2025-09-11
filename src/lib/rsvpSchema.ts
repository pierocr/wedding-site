// src/lib/rsvpSchema.ts
import { z } from "zod";

export const rsvpSchema = z.object({
  name: z.string().min(2, "Tu nombre es muy corto"),
  email: z.string().email("Correo inválido"),
  phone: z.string().optional(),
  attending: z.boolean(),
  guests: z.number().int().min(0).max(10),
  diet: z.string().max(200).optional(),
  message: z.string().max(1000).optional(),
  source: z.string().optional(),
  user_agent: z.string().optional(),
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
