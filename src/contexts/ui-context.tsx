"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Toast } from "@/types";

interface UIContextValue {
  sidebarOpen: boolean;
  currentLocationId: string | null;
  toasts: Toast[];
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCurrentLocation: (locationId: string | null) => void;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLocationId, setCurrentLocation] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <UIContext value={{
      sidebarOpen,
      currentLocationId,
      toasts,
      setSidebarOpen,
      toggleSidebar,
      setCurrentLocation,
      addToast,
      removeToast,
      clearToasts,
    }}>
      {children}
    </UIContext>
  );
}

export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error("useUI must be used within a UIProvider");
  }
  return context;
}
