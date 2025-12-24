"use client";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import React from "react";

interface LockedOverlayProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  isLocked: boolean;
}

export const LockedOverlay = ({
  children,
  title = "Próximamente",
  description,
  isLocked
}: LockedOverlayProps) => {
  if (!isLocked) {
    return <>{children}</>;
  }

  // Cuando está bloqueado, mostrar SOLO una línea compacta
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-sm font-medium text-foreground">
      <Lock className="h-4 w-4" />
      <span>{description || title}</span>
    </div>
  );
};
