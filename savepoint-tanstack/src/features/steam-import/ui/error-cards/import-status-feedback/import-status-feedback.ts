import { toast } from "sonner";

/**
 * Import-status feedback helpers (Slice 21 Phase D).
 *
 * Canonical's "ImportStatusToast" is not a rendered component — it's a set
 * of sonner-toast firing helpers used by the import flow. Ported as plain
 * functions so the imported-games widget can call them after the Steam-
 * library sync resolves or rejects.
 *
 * Naming mirrors canonical's `import-status-toast.tsx`:
 *   - `showSyncStartedToast` — fires on click of "Sync from Steam".
 *   - `showSyncCompletedToast(count)` — fires on resolve.
 *   - `showSyncFailedToast(message?)` — fires on reject.
 */
export function showSyncStartedToast(description?: string): void {
  toast.info("Steam library sync started", {
    description:
      description ??
      "This may take a few minutes. We'll notify you when it's complete.",
    duration: 5000,
  });
}

export function showSyncCompletedToast(gameCount: number): void {
  const gameLabel = gameCount === 1 ? "game" : "games";
  toast.success("Steam library sync completed", {
    description: `${gameCount} ${gameLabel} imported successfully.`,
    duration: 5000,
  });
}

export function showSyncFailedToast(errorMessage?: string): void {
  toast.error("Steam library sync failed", {
    description:
      errorMessage ??
      "Please try again or contact support if the issue persists.",
    duration: 6000,
  });
}
