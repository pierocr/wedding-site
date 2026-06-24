// src/lib/rsvpSchema.ts
import { z } from "zod";

export const attendingStatusSchema = z.enum(["yes", "no", "later"]);

export const rsvpSchema = z
  .object({
    name: z.string().trim().min(2, "Tu nombre es muy corto").max(120, "Tu nombre es muy largo"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Correo inválido")
      .max(254, "Correo demasiado largo"),
    phone: z.string().trim().max(30, "Teléfono demasiado largo").optional().default(""),
    attending_status: attendingStatusSchema.default("yes"),
    vegetarian: z.boolean().default(false),
    pescatarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    diet: z.string().trim().max(500, "Cuéntanoslo en menos de 500 caracteres").optional().default(""),
    message: z.string().trim().max(1000, "El mensaje debe tener menos de 1000 caracteres").optional().default(""),
    source: z.string().trim().max(120).optional().default("pieroydebby.cl/rsvp"),
  })
  .refine(
    (data) => [data.vegetarian, data.pescatarian, data.vegan].filter(Boolean).length <= 1,
    {
      message: "Elige solo una preferencia alimentaria",
      path: ["dietary_preference"],
    }
  );

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type AttendingStatus = z.infer<typeof attendingStatusSchema>;
