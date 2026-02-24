import { useQuery } from "@tanstack/react-query";
import { AppQueryConfig } from "@/constants/api";
import { queryKeys } from "@/constants/queryKeys";
import {
  getLocations,
  getLocation,
  getLocationStaff,
} from "@/app/services/locations";

export function useFetchLocations() {
  return useQuery({
    queryKey: queryKeys.Locations(),
    queryFn: getLocations,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}

export function useFetchLocation(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.Location(id),
    queryFn: () => getLocation(id),
    enabled: !!id && enabled,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}

export function useFetchLocationStaff(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.LocationStaff(id),
    queryFn: () => getLocationStaff(id),
    enabled: !!id && enabled,
    staleTime: AppQueryConfig.ApiFetchStaleTime,
  });
}
