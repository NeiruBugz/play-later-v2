"use client";

import { Download, Loader2, RefreshCw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

import { steamImportConfig } from "../config";
import { isSteamPrivacyError } from "../lib/utils";
import { triggerBackgroundSync } from "../server-actions/trigger-background-sync";
import type { SteamImportResult } from "../types";
import {
  showSyncFailedToast,
  showSyncStartedToast,
} from "./import-status-toast";
import { SteamPrivacyError } from "./steam-privacy-error";

type ImportState = "idle" | "loading" | "success" | "error";

type ImportPathSelectorProps = {
  onImportComplete?: (result: {
    imported: number;
    total: number;
    filtered: number;
  }) => void;
};

export function ImportPathSelector({
  onImportComplete,
}: ImportPathSelectorProps) {
  const [state, setState] = useState<ImportState>("idle");
  const [result, setResult] = useState<SteamImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncPending, startSyncTransition] = useTransition();

  const handleFetchAndCurate = async (): Promise<void> => {
    setState("loading");
    setError(null);

    try {
      const response = await fetch("/api/steam/games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to fetch Steam games");
        setState("error");
        toast.error(data.error || "Failed to fetch Steam games");
        return;
      }

      const importResult: SteamImportResult = {
        imported: data.imported,
        total: data.total,
        filtered: data.filtered,
      };

      setResult(importResult);
      setState("success");
      toast.success(`Successfully imported ${data.imported} games from Steam`);

      if (onImportComplete) {
        onImportComplete(importResult);
      }
    } catch {
      setError("Network error. Please try again.");
      setState("error");
      toast.error("Network error. Please try again.");
    }
  };

  const handleRetry = (): void => {
    setState("idle");
    setError(null);
    setResult(null);
  };

  const handleBackgroundSync = (): void => {
    startSyncTransition(async () => {
      const result = await triggerBackgroundSync({ type: "FULL_SYNC" });

      if (result.success) {
        showSyncStartedToast();
      } else {
        showSyncFailedToast(result.error);
      }
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Fetch & Curate Card */}
      <Card variant="elevated">
        <CardHeader spacing="comfortable">
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Fetch &amp; Curate
          </CardTitle>
          <CardDescription>
            Import your Steam library now and curate your games
          </CardDescription>
        </CardHeader>
        <CardContent spacing="comfortable" className="space-y-4">
          {state === "idle" && (
            <Button onClick={handleFetchAndCurate} className="w-full">
              <Download className="h-4 w-4" />
              Fetch My Steam Games
            </Button>
          )}

          {state === "loading" && (
            <Button disabled className="w-full">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching Steam games...
            </Button>
          )}

          {state === "success" && result && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-medium">Import complete!</p>
                    <p className="text-muted-foreground text-sm">
                      Imported {result.imported} of {result.total} games
                      {result.filtered > 0 &&
                        ` (${result.filtered} filtered out)`}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Fetch Again
              </Button>
            </div>
          )}

          {state === "error" && error && (
            <div className="space-y-4">
              {isSteamPrivacyError(error) ? (
                <SteamPrivacyError message={error} />
              ) : (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Background Sync Card */}
      <Card
        variant="elevated"
        className={
          steamImportConfig.isBackgroundSyncEnabled ? "" : "opacity-60"
        }
      >
        <CardHeader spacing="comfortable">
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Background Sync
            {!steamImportConfig.isBackgroundSyncEnabled && (
              <Badge variant="subtle">Coming Soon</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Automatically sync your Steam library in the background
          </CardDescription>
        </CardHeader>
        <CardContent spacing="comfortable">
          {steamImportConfig.isBackgroundSyncEnabled ? (
            <Button
              onClick={handleBackgroundSync}
              disabled={isSyncPending}
              className="w-full"
            >
              {isSyncPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting Sync...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Enable Background Sync
                </>
              )}
            </Button>
          ) : (
            <>
              <Button disabled className="w-full">
                Enable Background Sync
              </Button>
              <p className="text-muted-foreground mt-2 text-xs">
                This feature will be available in a future update
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
