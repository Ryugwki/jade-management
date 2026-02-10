export type UserRole = "SUPER_ADMIN" | "ADMIN" | "GUEST";

export type UserPermissionLevel =
  | "full"
  | "manage"
  | "read"
  | "limited"
  | "none";

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  password?: string;
  permissions?: Record<string, UserPermissionLevel>;
  isActive?: boolean;
  updatedBy?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  language?: string;
  timezone?: string;
  isGuest?: boolean;
  guestToken?: string | null;
}
