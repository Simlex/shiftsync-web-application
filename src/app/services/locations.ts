import { api } from "@/lib/api-client";
import type { Location, User } from "@/types";

export async function getLocations(): Promise<Location[]> {
  const res = await api.locations.getLocations();
  const data = res.data;
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getLocation(id: string): Promise<Location> {
  const res = await api.locations.getLocation(id);
  return res.data;
}

export async function getLocationStaff(id: string): Promise<User[]> {
  const res = await api.locations.getLocationStaff(id);
  const data = res.data;
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getManagedLocations(): Promise<Location[]> {
  const res = await api.locations.getManagedLocations();
  const data = res.data;
  return Array.isArray(data) ? data : data?.data ?? [];
}
