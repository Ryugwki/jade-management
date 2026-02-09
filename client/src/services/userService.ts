import api from "@/lib/api/axiosInstance";
import type { User } from "@/types/user";

export async function listUsers(): Promise<User[]> {
  const response = await api.get("/user");
  return response.data.users as User[];
}

export async function createUser(payload: {
  email: string;
  password: string;
  role?: User["role"];
  name?: string;
  permissions?: User["permissions"];
}): Promise<User> {
  const response = await api.post("/user", payload);
  return response.data.user as User;
}

export async function getUser(id: string): Promise<User> {
  const response = await api.get(`/user/${id}`);
  return response.data.user as User;
}

export async function updateUser(
  id: string,
  payload: Partial<User>,
): Promise<User> {
  const response = await api.put(`/user/${id}`, payload);
  return response.data.user as User;
}

export async function deleteUser(id: string): Promise<void> {
  await api.delete(`/user/${id}`);
}

export async function changeMyPassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await api.post("/user/me/password", payload);
}
