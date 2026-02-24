import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppQueryConfig } from "@/constants/api";
import { queryKeys } from "@/constants/queryKeys";
import { getShifts } from "@/services/shifts";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Shift } from "@/types";

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

export function usePublishShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.shifts.publishShift,
    onSuccess: (response) => {
      const shift = response.data as Shift; // Backend returns the updated shift
      // Invalidate and refetch shifts queries
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      if (shift?.id) {
        queryClient.invalidateQueries({ queryKey: ["shift", shift.id] });
      }

      toast.success("Shift published successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to publish shift");
    },
  });
}

export function useUnpublishShift() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.shifts.unpublishShift,
    onSuccess: (response) => {
      const shift = response.data as any; // Backend returns the updated shift
      // Invalidate and refetch shifts queries
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      if (shift?.id) {
        queryClient.invalidateQueries({ queryKey: ["shift", shift.id] });
      }

      toast.success("Shift unpublished successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to unpublish shift");
    },
  });
}
