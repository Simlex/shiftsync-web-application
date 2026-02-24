import { api } from "@/lib/api-client";
import type { DropRequest } from "@/types";

export async function getDrops(params?: {
  status?: string;
  userId?: string;
}): Promise<DropRequest[]> {
  const res = await api.drops.getDrops(params);
  const data = res.data;
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getMyDrops(params?: {
  status?: string;
}): Promise<DropRequest[]> {
  const res = await api.drops.getMyDrops(params);
  const data = res.data;
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function getDrop(id: string): Promise<DropRequest> {
  const res = await api.drops.getDrop(id);
  const data = res.data;
  return data && typeof data === "object" && "data" in data ? data.data : data;
}
