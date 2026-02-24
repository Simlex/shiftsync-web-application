import { api } from "@/lib/api-client";
import type { User } from "@/types";

export async function getUsers(params?: {
  role?: string;
  locationId?: string;
}): Promise<User[]> {
  const res = await api.users.getUsers(params);
  const data = res.data;
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getUser(id: string): Promise<User> {
  const res = await api.users.getUser(id);
  return res.data;
}

export async function getUserProfile(): Promise<User> {
  const res = await api.users.getProfile();
  return res.data;
}
