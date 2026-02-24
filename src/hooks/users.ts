import { useQuery } from "@tanstack/react-query";
import { AppQueryConfig } from "@/constants/api";
import { queryKeys } from "@/constants/queryKeys";
import { getUsers, getUser } from "@/app/services/users";

export function useFetchUsers(params?: {
  role?: string;
  locationId?: string;
}) {
  return useQuery({
    queryKey: queryKeys.Users(params),
    queryFn: () => getUsers(params),
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}

export function useFetchUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.User(id),
    queryFn: () => getUser(id),
    enabled: !!id && enabled,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}
