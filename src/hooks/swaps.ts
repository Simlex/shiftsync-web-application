import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppQueryConfig } from "@/constants/api";
import { queryKeys } from "@/constants/queryKeys";
import { getSwaps, getMyShifts } from "@/services/swaps";
import { api } from "@/lib/api-client";
import { toast } from "sonner";

export function useFetchSwaps(
  params?: {
    status?: string;
    userId?: string;
  },
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.Swaps(params),
    queryFn: () => getSwaps(params),
    enabled,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}

export function useFetchMyShifts(userId?: string, enabled = true) {
  return useQuery({
    queryKey: ["shifts", "user", userId || "current"],
    queryFn: () => getMyShifts(userId, enabled),
    enabled: enabled && (!!userId || !userId),
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}

export function useCreateSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      fromAssignmentId: string;
      toUserId: string;
      reason?: string;
    }) => api.swaps.createSwap(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Swap request created successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to create swap request",
      );
    },
  });
}

export function useApproveSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.swaps.approveSwap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      toast.success("Swap request approved");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to approve swap request",
      );
    },
  });
}

export function useRejectSwap() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.swaps.rejectSwap(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["swaps"] });
      toast.success("Swap request rejected");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Failed to reject swap request",
      );
    },
  });
}
