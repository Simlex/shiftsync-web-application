import { useQuery } from "@tanstack/react-query";
import { AppQueryConfig } from "@/constants/api";
import { queryKeys } from "@/constants/queryKeys";
import { getShifts } from "@/app/services/shifts";

export function useFetchShifts(
  params?: {
    locationId?: string;
    startDate?: string;
    endDate?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.Shifts(params),
    queryFn: () => getShifts(params),
    enabled,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}
