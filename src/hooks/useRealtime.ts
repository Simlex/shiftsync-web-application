import { useRealtimeContext } from "@/contexts/realtime-context";
import { SocketEventMap } from "@/types";

export const useRealtime = () => {
  const { socket, connectionStatus } = useRealtimeContext();

  const on = <K extends keyof SocketEventMap>(
    event: K,
    callback: SocketEventMap[K]
  ) => {
    if (socket) {
      socket.on(event as string, callback as (...args: unknown[]) => void);
    }
  };

  const off = <K extends keyof SocketEventMap>(
    event: K,
    callback: SocketEventMap[K]
  ) => {
    if (socket) {
      socket.off(event as string, callback as (...args: unknown[]) => void);
    }
  };

  const emit = <K extends keyof SocketEventMap>(
    event: K,
    ...args: unknown[]
  ) => {
    if (socket) {
      socket.emit(event as string, ...args);
    }
  };

  return {
    socket,
    connectionStatus,
    on,
    off,
    emit,
    isConnected: connectionStatus === "connected",
  };
};
