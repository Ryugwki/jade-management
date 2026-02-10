import React from "react";
import { usePermission } from "@/hooks/usePermission";

type PermissionGateProps = {
  resource: Parameters<typeof usePermission>[0];
  action: Parameters<typeof usePermission>[1];
  children: React.ReactNode;
};

export function PermissionGate({
  resource,
  action,
  children,
}: PermissionGateProps) {
  const allowed = usePermission(resource, action);
  if (!allowed) return null;
  return <>{children}</>;
}
