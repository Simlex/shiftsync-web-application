"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { UIProvider } from "@/contexts/ui-context";
import { RealtimeProvider } from "@/contexts/realtime-context";
import { useKeepAlive } from "@/app/client-hooks";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});

function KeepAlive() {
  useKeepAlive();
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UIProvider>
            <RealtimeProvider>
              <KeepAlive />
              {children}
              <Toaster richColors position="top-right" />
            </RealtimeProvider>
          </UIProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
