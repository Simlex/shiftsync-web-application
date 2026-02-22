"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [isLoading, setLoading] = useState(true);

  const setUser = useCallback((user: User | null) => {
    setUserState(user);
    setAuthenticated(!!user);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
    setAuthenticated(false);
    setLoading(false);
  }, []);

  return (
    <AuthContext value={{
      user,
      isAuthenticated,
      isLoading,
      setUser,
      setAuthenticated,
      setLoading,
      logout,
    }}>
      {children}
    </AuthContext>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
