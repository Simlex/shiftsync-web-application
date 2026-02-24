import { api } from "@/lib/api-client";
import type { SwapRequest } from "@/types";

export async function getSwaps(params?: {
  status?: string;
  userId?: string;
}): Promise<SwapRequest[]> {
  const response = await api.swaps.getSwaps(params);
  return response.data;
}

export async function getMyShifts(
  userId?: string,
  enabled?: boolean,
): Promise<any[]> {
  if (!enabled && !userId) return [];

  // If userId is provided, use general shifts endpoint with userId filter
  if (userId) {
    const response = await api.shifts.getShifts({
      userId,
      startDate: new Date().toISOString(),
    });
    return response.data;
  }

  // Otherwise use my-shifts endpoint for current user
  const response = await api.shifts.getMyShifts({
    startDate: new Date().toISOString(),
  });
  return response.data;
}
