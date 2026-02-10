import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { User, UserPermissionLevel } from "@/types/user";

type PermissionResource =
  | "product"
  | "pricing"
  | "user"
  | "permission"
  | "audit"
  | "approval";

type PermissionAction =
  | "read"
  | "manage"
  | "full"
  | "create"
  | "update"
  | "delete"
  | "disable"
  | "approve";

const levelOrder: UserPermissionLevel[] = [
  "none",
  "limited",
  "read",
  "manage",
  "full",
];

const resourceAreaMap: Record<PermissionResource, string> = {
  product: "Inventory & products",
  pricing: "Pricing & billing",
  user: "User management",
  permission: "Security settings",
  audit: "Audit logs",
  approval: "Security settings",
};

const actionMinLevel: Record<PermissionAction, UserPermissionLevel> = {
  read: "read",
  manage: "manage",
  full: "full",
  create: "manage",
  update: "manage",
  delete: "manage",
  disable: "manage",
  approve: "full",
};

const getLevelRank = (level?: UserPermissionLevel | null) =>
  level ? levelOrder.indexOf(level) : -1;

const defaultLevelForRole = (role: User["role"], area: string) => {
  if (role === "SUPER_ADMIN") return "full" as const;
  if (role === "ADMIN") {
    if (area === "Inventory & products" || area === "Pricing & billing") {
      return "manage" as const;
    }
    return "none" as const;
  }
  if (role === "GUEST") {
    if (area === "Inventory & products") return "read" as const;
    return "none" as const;
  }
  return "none" as const;
};

const resolvePermissionLevel = (user: User | null, area: string) => {
  if (!user) return "none" as const;
  if (user.role === "SUPER_ADMIN") return "full" as const;
  const explicitLevel = user.permissions?.[area];
  return explicitLevel || defaultLevelForRole(user.role, area);
};

export function usePermission(
  resource: PermissionResource,
  action: PermissionAction,
) {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    const area = resourceAreaMap[resource];
    const currentLevel = resolvePermissionLevel(user, area);
    const requiredLevel = actionMinLevel[action];
    return getLevelRank(currentLevel) >= getLevelRank(requiredLevel);
  }, [user, resource, action]);
}

export function hasPermission(
  user: User | null,
  resource: PermissionResource,
  action: PermissionAction,
) {
  if (!user) return false;
  const area = resourceAreaMap[resource];
  const currentLevel = resolvePermissionLevel(user, area);
  const requiredLevel = actionMinLevel[action];
  return getLevelRank(currentLevel) >= getLevelRank(requiredLevel);
}
