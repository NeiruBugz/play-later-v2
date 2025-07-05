"use client";

import { ExternalLink, Unlink } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

import { Button } from "@/shared/components";
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
  const router = useRouter();

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
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="text-destructive hover:text-destructive"
            >
              <Unlink className="mr-1 h-4 w-4" />
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
