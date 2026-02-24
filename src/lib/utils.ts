import { LOCATION_COLORS } from "@/constants/schedule";
import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function extractData<T>(response: { data: T[] } | T[] | undefined): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.data;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatTimezone(tz: string): string {
  return tz.replace(/_/g, " ").split("/").pop() ?? tz;
}

export function getLocationColor(
  locationId: string,
  locationIds: string[],
): string {
  const index = locationIds.indexOf(locationId);
  return LOCATION_COLORS[index % LOCATION_COLORS.length];
}
