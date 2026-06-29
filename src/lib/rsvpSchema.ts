// src/lib/rsvpSchema.ts
import { z } from "zod";

export const attendingStatusSchema = z.enum(["yes", "no", "later"]);
export const companionStatusSchema = z.enum(["no", "yes", "later"]);

const dietaryPreferenceRefinement = (
  data: { vegetarian: boolean; pescatarian: boolean; vegan: boolean },
  ctx: z.RefinementCtx,
  path: string[],
) => {
  if (
    [data.vegetarian, data.pescatarian, data.vegan].filter(Boolean).length > 1
  ) {
    ctx.addIssue({
      code: "custom",
      message: "Elige solo una preferencia alimentaria",
      path,
    });
  }
};

export const rsvpCompanionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nombre del acompañante es muy corto")
    .max(120, "El nombre del acompañante es muy largo"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Correo del acompañante inválido")
    .max(254, "Correo del acompañante demasiado largo"),
  phone: z
    .string()
    .trim()
    .max(30, "Teléfono del acompañante demasiado largo")
    .optional()
    .default(""),
  vegetarian: z.boolean().default(false),
  pescatarian: z.boolean().default(false),
  vegan: z.boolean().default(false),
  diet: z
    .string()
    .trim()
    .max(500, "Cuéntanoslo en menos de 500 caracteres")
    .optional()
    .default(""),
});

export const rsvpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Tu nombre es muy corto")
      .max(120, "Tu nombre es muy largo"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Correo inválido")
      .max(254, "Correo demasiado largo"),
    phone: z
      .string()
      .trim()
      .max(30, "Teléfono demasiado largo")
      .optional()
      .default(""),
    attending_status: attendingStatusSchema.default("yes"),
    vegetarian: z.boolean().default(false),
    pescatarian: z.boolean().default(false),
    vegan: z.boolean().default(false),
    diet: z
      .string()
      .trim()
      .max(500, "Cuéntanoslo en menos de 500 caracteres")
      .optional()
      .default(""),
    companion_status: companionStatusSchema.default("no"),
    companion: rsvpCompanionSchema.optional(),
    message: z
      .string()
      .trim()
      .max(1000, "El mensaje debe tener menos de 1000 caracteres")
      .optional()
      .default(""),
    source: z
      .string()
      .trim()
      .max(120)
      .optional()
      .default("pieroydebby.cl/rsvp"),
  })
  .superRefine((data, ctx) => {
    dietaryPreferenceRefinement(data, ctx, ["dietary_preference"]);

    if (data.companion) {
      dietaryPreferenceRefinement(data.companion, ctx, [
        "companion",
        "dietary_preference",
      ]);
    }

    if (data.attending_status !== "yes" && data.companion_status !== "no") {
      ctx.addIssue({
        code: "custom",
        message: "Solo puedes agregar acompañante si confirmas asistencia",
        path: ["companion_status"],
      });
    }

    if (data.companion_status === "yes" && !data.companion) {
      ctx.addIssue({
        code: "custom",
        message: "Ingresa los datos del acompañante",
        path: ["companion"],
      });
    }

    if (
      data.companion_status === "yes" &&
      data.companion?.email === data.email
    ) {
      ctx.addIssue({
        code: "custom",
        message: "El correo del acompañante debe ser distinto al del invitado",
        path: ["companion", "email"],
      });
    }
  });

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type AttendingStatus = z.infer<typeof attendingStatusSchema>;
export type CompanionStatus = z.infer<typeof companionStatusSchema>;
