"use server";

import { revalidatePath } from "next/cache";
import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { syncGuestDirectory } from "@/lib/guestDirectory";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type GuestSyncState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function manualConfirmationAction(
  _previousState: GuestSyncState,
  formData: FormData,
): Promise<GuestSyncState> {
  if (!(await hasDashboardAccess())) return { status: "error", message: "Tu sesión expiró. Ingresa nuevamente al dashboard." };
  const guestId = String(formData.get("guestId") || "");
  const name = String(formData.get("name") || "");
  const scope = String(formData.get("scope") || "");
  const confirmed = formData.get("confirmed") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(guestId) || !name || !["guest", "companion"].includes(scope)) {
    return { status: "error", message: "No se pudo identificar el registro." };
  }
  const supabase = getSupabaseAdmin();
  if (confirmed) {
    const { data: guest, error } = await supabase.from("guest_directory").select("first_name, last_name, is_active").eq("id", guestId).maybeSingle();
    const currentName = [guest?.first_name, guest?.last_name].filter(Boolean).join(" ");
    if (error || !guest?.is_active || currentName !== name) {
      return { status: "error", message: "La lista cambió. Recarga el dashboard antes de continuar." };
    }
  } else {
    const { data: latest, error } = await supabase.from("manual_guest_confirmation_events").select("confirmed").eq("guest_id", guestId).eq("guest_name", name).eq("scope", scope).order("id", { ascending: false }).limit(1).maybeSingle();
    if (error || !latest?.confirmed) return { status: "error", message: "La confirmación ya cambió. Recarga el dashboard." };
  }
  const { error } = await supabase.from("manual_guest_confirmation_events").insert({ guest_id: guestId, guest_name: name, scope, confirmed });
  if (error) {
    console.error("Manual confirmation failed", error);
    return { status: "error", message: "No se pudo guardar el cambio. Inténtalo nuevamente." };
  }
  revalidatePath("/dashboard");
  return { status: "success", message: confirmed ? "Confirmación manual registrada." : "Confirmación manual anulada." };
}

function syncErrorMessage(error: unknown) {
  const detail = error instanceof Error ? error.message : "";

  if (
    detail.includes("Google Drive API has not been used") ||
    detail.includes("disabled")
  ) {
    return "Falta activar Google Drive API en el proyecto de Google Cloud. Actívala, espera unos minutos e inténtalo nuevamente.";
  }

  if (
    detail.includes("insufficient permissions") ||
    detail.includes("not have permission")
  ) {
    return "La cuenta de servicio no tiene acceso al Excel. Revisa que esté compartido como Lector e inténtalo nuevamente.";
  }

  return "No se pudo actualizar la lista. Verifica el acceso de la cuenta de servicio al Excel e inténtalo otra vez.";
}

export async function syncGuestDirectoryAction(
  _previousState: GuestSyncState,
  _formData: FormData,
): Promise<GuestSyncState> {
  if (!(await hasDashboardAccess())) {
    return {
      status: "error",
      message: "Tu sesión expiró. Ingresa nuevamente al dashboard.",
    };
  }

  try {
    const result = await syncGuestDirectory();
    revalidatePath("/dashboard");
    return {
      status: "success",
      message: `Lista actualizada: ${result.guestCount} invitados en ${result.rowsSeen} grupos.`,
    };
  } catch (error) {
    console.error("Guest directory sync failed", error);
    return {
      status: "error",
      message: syncErrorMessage(error),
    };
  }
}
