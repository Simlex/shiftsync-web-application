import { useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const PING_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Pings the API health endpoint every 10 minutes to prevent the server
 * from spinning down due to inactivity on free-tier hosting (e.g. Render).
 *
 * Only runs in the browser. Uses a plain fetch so no auth interceptors fire.
 */
export function useKeepAlive() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const ping = async () => {
      try {
        await fetch(`${API_URL}/health`, {
          method: "GET",
          cache: "no-store",
        });
      } catch {
        // Silently ignore — the ping is best-effort
      }
    };

    // Ping once immediately on mount, then on interval
    ping();
    const intervalId = setInterval(ping, PING_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, []);
}
