import { api } from "@/lib/api-client";
import type { Shift } from "@/types";

export async function getShifts(params?: {
  locationId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<Shift[]> {
  const res = await api.shifts.getShifts(params ?? {});
  const data = res.data;
  return Array.isArray(data) ? data : data?.data ?? [];
}

export async function getShift(id: string): Promise<Shift> {
  const res = await api.shifts.getShift(id);
  return res.data;
}
