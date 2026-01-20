"use client";

import { toast } from "sonner";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastOptions = {
  description?: string;
  duration?: number;
};

/**
 * Show a toast notification when Steam library sync starts
 */
export function showSyncStartedToast(options?: ToastOptions): void {
  toast.info("Steam library sync started", {
    description:
      options?.description ??
      "This may take a few minutes. We'll notify you when it's complete.",
    duration: options?.duration ?? 5000,
  });
}

/**
 * Show a toast notification when Steam library sync completes successfully
 */
export function showSyncCompletedToast(
  gameCount: number,
  options?: ToastOptions
): void {
  const gameLabel = gameCount === 1 ? "game" : "games";
  toast.success("Steam library sync completed", {
    description:
      options?.description ??
      `${gameCount} ${gameLabel} imported successfully.`,
    duration: options?.duration ?? 5000,
  });
}

/**
 * Show a toast notification when Steam library sync fails
 */
export function showSyncFailedToast(
  errorMessage?: string,
  options?: ToastOptions
): void {
  toast.error("Steam library sync failed", {
    description:
      errorMessage ??
      options?.description ??
      "Please try again or contact support if the issue persists.",
    duration: options?.duration ?? 6000,
  });
}

/**
 * Show a toast notification when a sync is already in progress
 */
export function showSyncAlreadyInProgressToast(options?: ToastOptions): void {
  toast.warning("Sync already in progress", {
    description:
      options?.description ??
      "A Steam library sync is currently running. Please wait for it to complete.",
    duration: options?.duration ?? 4000,
  });
}

/**
 * Show a generic import status toast with custom message
 */
export function showImportStatusToast(
  message: string,
  variant: ToastVariant = "info",
  options?: ToastOptions
): void {
  const toastFn = toast[variant];
  toastFn(message, {
    description: options?.description,
    duration: options?.duration ?? 5000,
  });
}
