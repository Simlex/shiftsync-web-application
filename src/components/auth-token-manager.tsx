"use client";

import { useAuthToken } from "@/app/client-hooks/useAuthToken";

/**
 * Component that automatically manages API client authentication
 * Must be a child of SessionProvider
 */
export function AuthTokenManager() {
  useAuthToken();
  return null; // This component doesn't render anything
}
