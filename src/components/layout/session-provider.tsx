"use client";

import { useEffect, type ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { useAuth } from "@/contexts/auth-context";
import { AuthTokenManager } from "@/components/auth-token-manager";
import type { User } from "@/types";

interface AuthSessionProviderProps {
  children: ReactNode;
  session: Session | null;
  user: User | null;
}

export function AuthSessionProvider({
  children,
  session,
  user,
}: AuthSessionProviderProps) {
  const { setUser } = useAuth();

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return (
    <SessionProvider session={session}>
      <AuthTokenManager />
      {children}
    </SessionProvider>
  );
}
