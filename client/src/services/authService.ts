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
