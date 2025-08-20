"use client";

import { ExternalLink, RefreshCcw, Unlink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  getUserOwnedGames,
  saveSteamGames,
} from "@/features/steam-integration/server-actions";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/tailwind-merge";

type ServiceIntegrationProps = {
  id: string;
  name: string;
  icon: ReactNode;
  isDisabled: boolean;
  description: string;
  isConnected?: boolean;
  connectedUsername?: string;
  profileUrl?: string;
  onDisconnect?: () => Promise<void>;
};

export function ServiceIntegration({
  id,
  name,
  icon,
  isDisabled,
  description,
  isConnected = false,
  connectedUsername,
  profileUrl,
  onDisconnect,
}: ServiceIntegrationProps) {
  const [isSyncing, setIsSyncing] = useState(false);

  const handleConnect = async () => {
    if (isDisabled) return;

    if (id === "steam") {
      // Redirect to Steam connection endpoint
      window.location.href = "/api/steam/connect";
    }
    // Add other service connection logic here
  };

  const handleDisconnect = async () => {
    if (onDisconnect) {
      await onDisconnect();
    }
  };

  const handleViewProfile = () => {
    if (profileUrl) {
      window.open(profileUrl, "_blank");
    }
  };

  const handleSyncLibraries = async () => {
    if (isSyncing) return;
    if (id === "steam" && connectedUsername) {
      setIsSyncing(true);
      try {
        const { data: ownedGames, serverError: fetchError } =
          await getUserOwnedGames({
            steamUsername: connectedUsername,
          });

        if (fetchError) {
          toast.error("Failed to fetch Steam games", {
            description: fetchError,
          });
          return;
        }
        if (!ownedGames || !Array.isArray(ownedGames)) {
          toast.error("No games found in your Steam library.");
          return;
        }

        const { serverError, validationErrors } = await saveSteamGames({
          games: ownedGames,
        });

        if (serverError) {
          toast.error("Failed to import Steam games", {
            description: serverError,
          });
          return;
        }
        if (validationErrors) {
          toast.error("Validation error while importing games.");
          return;
        }
        toast.success("Steam library synced successfully!");
      } catch {
        toast.error(
          "An unexpected error occurred while syncing your Steam library."
        );
      } finally {
        setIsSyncing(false);
      }
    }
  };

  return (
    <div className="flex w-full items-center justify-between gap-2 rounded-sm border p-3">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-10 w-10 items-center justify-center")}>
          {icon}
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-medium">{name}</p>
          <p className="text-sm text-muted-foreground">
            {isConnected && connectedUsername
              ? `Connected as ${connectedUsername}`
              : description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isConnected ? (
          <>
            {profileUrl && (
              <Button variant="ghost" size="sm" onClick={handleViewProfile}>
                <ExternalLink className="size-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              disabled={id !== "steam" || !connectedUsername || isSyncing}
              onClick={handleSyncLibraries}
            >
              {isSyncing ? (
                <span className="flex items-center">
                  <RefreshCcw className="mr-1 size-4 animate-spin" />
                  Syncing...
                </span>
              ) : (
                <>
                  <RefreshCcw className="mr-1 size-4" />
                  Sync Libraries
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-destructive hover:text-destructive"
            >
              <Unlink className="mr-1 size-4" />
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={isDisabled}
            onClick={handleConnect}
          >
            {isDisabled ? "Coming soon" : "Connect"}
          </Button>
        )}
      </div>
    </div>
  );
}
