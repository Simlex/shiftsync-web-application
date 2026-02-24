import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, getErrorMessage } from "@/lib/api-client";
import { queryKeys } from "@/constants/queryKeys";
import { AppQueryConfig } from "@/constants/api";
import { getDrops, getMyDrops, getDrop } from "@/services/drops";
import { DropRequestStatus } from "@/types";

// Query Hooks
export const useDrops = (params?: { status?: string; userId?: string }) => {
  return useQuery({
    queryKey: queryKeys.Drops(params),
    queryFn: () => getDrops(params),
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
};

export const useMyDrops = (status?: DropRequestStatus) => {
  return useQuery({
    queryKey: queryKeys.MyDrops(status),
    queryFn: () => getMyDrops({ status }),
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
};

export const useOpenDrops = () => {
  return useQuery({
    queryKey: queryKeys.OpenDrops(),
    queryFn: () => getDrops({ status: "OPEN" }),
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
};

export const useDrop = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.Drop(id),
    queryFn: () => getDrop(id),
    enabled: !!id && enabled,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
};

// Mutation Hooks
export const useCreateDropRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      shiftId: string;
      reason?: string;
      expiresAt?: string;
    }) => api.drops.createDrop(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      toast.success("Your drop request has been submitted.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useClaimDropRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.drops.claimDrop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      toast.success("You have successfully claimed this shift.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useUpdateDropRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { reason?: string; expiresAt?: string };
    }) => api.drops.updateDrop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      toast.success("Your drop request has been updated.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useCancelDropRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.drops.cancelDrop(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      toast.success("Your drop request has been cancelled.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};

export const useExtendDropRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 1);
      return api.drops.extendDrop(id, newExpiry.toISOString());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drops"] });
      toast.success("Drop request expiry has been extended by 24 hours.");
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error));
    },
  });
};
