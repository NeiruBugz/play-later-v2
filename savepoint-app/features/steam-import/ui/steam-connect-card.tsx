"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { IconContext } from "react-icons";
import { FaSteam } from "react-icons/fa";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import {
  isSteamApiUnavailableError,
  isSteamPrivacyError,
  isSteamProfileNotFoundError,
  isSteamRateLimitError,
} from "../lib/utils";
import { connectSteamSchema, type ConnectSteamInput } from "../schemas";
import { disconnectSteam } from "../server-actions/disconnect-steam";
import type { SteamConnectionStatus } from "../types";
import { SteamApiUnavailableError } from "./steam-api-unavailable-error";
import { SteamPrivacyError } from "./steam-privacy-error";
import { SteamProfileNotFoundError } from "./steam-profile-not-found-error";
import { SteamRateLimitError } from "./steam-rate-limit-error";

type SteamConnectCardProps = {
  initialStatus?: SteamConnectionStatus;
};

function SteamIcon({ className }: { className?: string }) {
  return (
    <IconContext.Provider value={{ className }}>
      <FaSteam />
    </IconContext.Provider>
  );
}

export function SteamConnectCard({
  initialStatus = { connected: false },
}: SteamConnectCardProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [connectionStatus, setConnectionStatus] =
    useState<SteamConnectionStatus>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConnectSteamInput>({
    resolver: zodResolver(connectSteamSchema),
    defaultValues: {
      steamId: "",
    },
  });

  useEffect(() => {
    const steamStatus = searchParams.get("steam");
    const reason = searchParams.get("reason");

    if (steamStatus === "connected") {
      toast.success("Steam account connected successfully!");
      router.replace(pathname, { scroll: false });
    } else if (steamStatus === "error") {
      const errorMessages: Record<string, string> = {
        unauthorized: "You must be logged in to connect Steam",
        validation: "Steam authentication failed. Please try again.",
        profile: "Could not fetch your Steam profile. Please try again.",
        server: "An unexpected error occurred. Please try again.",
      };
      toast.error(
        errorMessages[reason || ""] || "Failed to connect Steam account"
      );
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  const connectSteam = async (data: ConnectSteamInput) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/steam/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamId: data.steamId }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to connect Steam account");
        return;
      }

      setConnectionStatus({ connected: true, profile: result.profile });
      toast.success("Steam account connected successfully!");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnectClick = () => {
    setShowDisconnectDialog(true);
  };

  const handleDisconnectConfirm = () => {
    startTransition(async () => {
      const result = await disconnectSteam({});

      if (result.success) {
        setConnectionStatus({ connected: false });
        setShowDisconnectDialog(false);
        toast.success("Steam account disconnected successfully");
      } else {
        toast.error(result.error || "Failed to disconnect Steam account");
      }
    });
  };

  if (connectionStatus.connected) {
    const { profile } = connectionStatus;

    return (
      <>
        <Card variant="elevated">
          <CardHeader spacing="comfortable">
            <CardTitle className="flex items-center gap-2">
              <SteamIcon className="h-5 w-5" />
              Steam Account Connected
            </CardTitle>
          </CardHeader>
          <CardContent
            spacing="comfortable"
            className="flex items-center gap-4"
          >
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full">
              <Image
                src={profile.avatarUrl}
                alt={profile.displayName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1">
              <p className="font-medium">{profile.displayName}</p>
              <p className="text-muted-foreground text-sm">
                {profile.steamId64}
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDisconnectClick}
              disabled={isPending}
            >
              Disconnect
            </Button>
          </CardContent>
        </Card>

        <Dialog
          open={showDisconnectDialog}
          onOpenChange={setShowDisconnectDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disconnect Steam Account</DialogTitle>
              <DialogDescription>
                Are you sure you want to disconnect your Steam account? Your
                imported games will be preserved in your library, but you will
                need to reconnect to import new games or update your Steam data.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDisconnectDialog(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnectConfirm}
                loading={isPending}
              >
                Disconnect
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Card variant="elevated">
      <CardHeader spacing="comfortable">
        <CardTitle className="flex items-center gap-2">
          <SteamIcon className="h-5 w-5" />
          Connect Steam Account
        </CardTitle>
        <CardDescription>
          Link your Steam account to import your game library and sync your
          collection
        </CardDescription>
      </CardHeader>
      <CardContent spacing="comfortable" className="space-y-6">
        {/* Primary: OAuth Button */}
        <div className="space-y-2">
          <Button asChild size="lg" className="w-full">
            <a href="/api/steam/auth">
              <SteamIcon className="h-5 w-5" />
              Sign in with Steam
            </a>
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            Recommended: Quick and secure
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background text-muted-foreground px-2">Or</span>
          </div>
        </div>

        {/* Secondary: Manual Form */}
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Enter your Steam ID manually
          </p>
          <form onSubmit={handleSubmit(connectSteam)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="steamId">Steam ID or Profile URL</Label>
              <Input
                id="steamId"
                placeholder="76561198012345678 or your custom URL"
                disabled={isLoading}
                aria-invalid={!!errors.steamId}
                aria-describedby={errors.steamId ? "steamId-error" : undefined}
                {...register("steamId")}
              />
              {errors.steamId && (
                <p
                  id="steamId-error"
                  className="text-destructive text-sm"
                  role="alert"
                >
                  {errors.steamId.message}
                </p>
              )}
            </div>
            {error && (
              <>
                {isSteamRateLimitError(error) ? (
                  <SteamRateLimitError
                    message={error}
                    onRetry={() => handleSubmit(connectSteam)()}
                  />
                ) : isSteamApiUnavailableError(error) ? (
                  <SteamApiUnavailableError
                    message={error}
                    onRetry={() => handleSubmit(connectSteam)()}
                  />
                ) : isSteamPrivacyError(error) ? (
                  <SteamPrivacyError
                    message={error}
                    onRetry={() => handleSubmit(connectSteam)()}
                  />
                ) : isSteamProfileNotFoundError(error) ? (
                  <SteamProfileNotFoundError
                    message={error}
                    onRetry={() => handleSubmit(connectSteam)()}
                  />
                ) : (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <SteamIcon className="h-4 w-4" />
                  Connect Steam
                </>
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
