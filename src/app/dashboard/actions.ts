"use server";

import { revalidatePath } from "next/cache";
import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { syncGuestDirectory } from "@/lib/guestDirectory";

export type GuestSyncState = {
  status: "idle" | "success" | "error";
  message: string;
};

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
