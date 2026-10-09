"use server";

import { revalidatePath } from "next/cache";
import { hasDashboardAccess } from "@/lib/dashboardAccess";
import { syncGuestDirectory } from "@/lib/guestDirectory";

export type GuestSyncState = {
  status: "idle" | "success" | "error";
  message: string;
};

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
      message:
        "No se pudo actualizar la lista. Verifica el acceso de la cuenta de servicio al Excel e inténtalo otra vez.",
    };
  }
}
