import axiosInstance from "@/lib/api/axiosInstance";
import type { User, UserRole } from "@/types/user";

const withPassword = (user: Omit<User, "password">, password = ""): User => ({
  ...user,
  password,
});

export async function login(payload: {
  email: string;
  password: string;
  role?: UserRole;
  name?: string;
}): Promise<User> {
  const response = await axiosInstance.post("/auth/login", payload);
  return withPassword(
    response.data.user as Omit<User, "password">,
    payload.password,
  );
}

export async function loginGuest(): Promise<User> {
  const response = await axiosInstance.post("/auth/guest");
  return withPassword(response.data.user as Omit<User, "password">);
}

export async function logout(): Promise<void> {
  await axiosInstance.post("/auth/logout");
}

export async function getMe(): Promise<User> {
  const response = await axiosInstance.get("/auth/me");
  return withPassword(response.data.user as Omit<User, "password">);
}

/**
 * Initialize a guest token for unauthenticated users
 * This creates a unique guest user tied to the current device/browser
 */
export async function initGuestToken(): Promise<{
  user: User;
  guestToken: string;
  isNewGuest: boolean;
}> {
  const response = await axiosInstance.post("/auth/guest-token");
  return {
    user: withPassword(response.data.user as Omit<User, "password">),
    guestToken: response.data.guestToken,
    isNewGuest: response.data.isNewGuest,
  };
}

/**
 * Get the guest token from localStorage
 */
export function getStoredGuestToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("guest_token");
}

/**
 * Store the guest token in localStorage
 */
export function storeGuestToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("guest_token", token);
}

/**
 * Remove the guest token from localStorage
 */
export function clearStoredGuestToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("guest_token");
}
