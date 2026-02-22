import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function extractData<T>(response: { data: T[] } | T[] | undefined): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  return response.data;
}
