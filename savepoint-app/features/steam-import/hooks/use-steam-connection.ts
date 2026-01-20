"use client";

import { useCallback, useMemo, useState } from "react";

import type { SteamConnectionStatus, SteamProfile } from "../types";

type UseSteamConnectionOptions = {
  initialStatus?: SteamConnectionStatus;
};

type UseSteamConnectionReturn = {
  status: SteamConnectionStatus;
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  profile: SteamProfile | null;
  connect: (steamId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
};

export function useSteamConnection(
  options?: UseSteamConnectionOptions
): UseSteamConnectionReturn {
  const [status, setStatus] = useState<SteamConnectionStatus>(
    options?.initialStatus ?? { connected: false }
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConnected = status.connected;
  const profile = status.connected ? status.profile : null;

  const connect = useCallback(async (steamId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/steam/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId }),
      });

      const contentType = response.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        setError("Unexpected response format");
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to connect Steam account");
        return;
      }

      setStatus({ connected: true, profile: result.profile });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setStatus({ connected: false });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return useMemo(
    () => ({
      status,
      isLoading,
      error,
      isConnected,
      profile,
      connect,
      disconnect,
      clearError,
    }),
    [
      status,
      isLoading,
      error,
      isConnected,
      profile,
      connect,
      disconnect,
      clearError,
    ]
  );
}

export type { UseSteamConnectionReturn };
