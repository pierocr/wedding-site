"use client";

import { useActionState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GuestSyncState } from "./actions";

const initialGuestSyncState: GuestSyncState = {
  status: "idle",
  message: "",
};

type GuestSyncFormProps = {
  action: (
    previousState: GuestSyncState,
    formData: FormData,
  ) => Promise<GuestSyncState>;
};

export function GuestSyncForm({ action }: GuestSyncFormProps) {
  const [state, formAction, isPending] = useActionState(
    action,
    initialGuestSyncState,
  );

  return (
    <div className="flex flex-col items-start gap-2 md:items-end">
      <form action={formAction}>
        <Button disabled={isPending} type="submit" variant="outline">
          <RefreshCw className={isPending ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          {isPending ? "Actualizando..." : "Actualizar invitados"}
        </Button>
      </form>
      {state.status !== "idle" ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "max-w-sm text-xs text-red-700"
              : "max-w-sm text-xs text-emerald-700"
          }
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
