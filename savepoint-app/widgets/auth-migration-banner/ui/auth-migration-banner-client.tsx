"use client";

import { X } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";

import { cn } from "@/shared/lib/ui/utils";

const STORAGE_KEY = "auth_migration_dismissed";

type AuthMigrationBannerClientProps = {
  formattedCutoverDate: string;
};

function subscribe(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function getSnapshot(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

function getServerSnapshot(): boolean {
  return false;
}

export function AuthMigrationBannerClient({
  formattedCutoverDate,
}: AuthMigrationBannerClientProps) {
  const dismissed = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const handleDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(
        new StorageEvent("storage", { key: STORAGE_KEY, newValue: "1" })
      );
    } catch {
      // Best-effort persistence; banner will reappear on next render if storage failed.
    }
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "border-warning/30 bg-warning/10 text-warning",
        "px-lg py-md sm:px-xl flex w-full items-start gap-3 border-b text-sm"
      )}
    >
      <p className="flex-1 leading-relaxed">
        We&rsquo;re upgrading our sign-in system on{" "}
        <span className="font-medium">{formattedCutoverDate}</span>.
        You&rsquo;ll be signed out and need to sign in again &mdash; your
        library, journal, and settings won&rsquo;t be affected.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss"
        className={cn(
          "shrink-0 rounded-sm opacity-70 transition-opacity",
          "hover:opacity-100 focus-visible:opacity-100",
          "focus-visible:ring-warning focus-visible:ring-2 focus-visible:outline-none"
        )}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
