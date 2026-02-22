"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { setAuthToken } from "@/lib/api-client";

/**
 * Hook that automatically sets the auth token for API requests
 * when the user's session changes
 */
export function useAuthToken() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.accessToken) {
      // Set the token for API requests
      setAuthToken(session.accessToken);
    } else if (status === "unauthenticated") {
      // Clear the token when not authenticated
      setAuthToken(null);
    }
  }, [session, status]);

  return { session, status };
}
