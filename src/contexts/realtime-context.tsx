"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Socket } from "socket.io-client";

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

interface RealtimeContextValue {
  socket: Socket | null;
  connectionStatus: ConnectionStatus;
  setSocket: (socket: Socket | null) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  disconnect: () => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [socket, setSocketState] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>("disconnected");

  const setSocket = useCallback((socket: Socket | null) => {
    setSocketState(socket);
  }, []);

  const disconnect = useCallback(() => {
    setSocketState((prev) => {
      if (prev) {
        prev.disconnect();
      }
      return null;
    });
    setConnectionStatus("disconnected");
  }, []);

  return (
    <RealtimeContext value={{
      socket,
      connectionStatus,
      setSocket,
      setConnectionStatus,
      disconnect,
    }}>
      {children}
    </RealtimeContext>
  );
}

export function useRealtimeContext(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error(
      "useRealtimeContext must be used within a RealtimeProvider"
    );
  }
  return context;
}
