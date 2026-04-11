"use client";

import { useEffect, useMemo, useState } from "react";

import { checkUsernameAvailability } from "@/features/profile/server-actions/check-username-availability";
import {
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  USERNAME_VALIDATION_DEBOUNCE_MS,
} from "@/shared/constants";

type ValidationStatus = "idle" | "validating" | "available" | "error";

interface UseUsernameValidationResult {
  validationStatus: ValidationStatus;
  validationMessage: string;
}

type SyncResult =
  | { kind: "resolved"; status: ValidationStatus; message: string }
  | { kind: "async" };

function getSyncValidation(
  username: string,
  currentUsername?: string
): SyncResult {
  if (!username || username.trim().length === 0) {
    return { kind: "resolved", status: "idle", message: "" };
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return {
      kind: "resolved",
      status: "error",
      message: `Username must be at least ${USERNAME_MIN_LENGTH} characters`,
    };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return {
      kind: "resolved",
      status: "error",
      message: `Username must not exceed ${USERNAME_MAX_LENGTH} characters`,
    };
  }
  if (currentUsername && username === currentUsername) {
    return { kind: "resolved", status: "idle", message: "" };
  }
  return { kind: "async" };
}

type AsyncResolution = {
  forUsername: string;
  status: "available" | "error";
  message: string;
};

export function useUsernameValidation(
  username: string,
  currentUsername?: string
): UseUsernameValidationResult {
  const syncResult = useMemo(
    () => getSyncValidation(username, currentUsername),
    [username, currentUsername]
  );

  const [asyncResolution, setAsyncResolution] =
    useState<AsyncResolution | null>(null);

  useEffect(() => {
    if (syncResult.kind === "resolved") return;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability({ username });
        if (controller.signal.aborted) return;
        if (result.success) {
          setAsyncResolution({
            forUsername: username,
            ...(result.available
              ? { status: "available", message: "Username available" }
              : { status: "error", message: "Username already exists" }),
          });
        } else {
          setAsyncResolution({
            forUsername: username,
            status: "error",
            message: result.error,
          });
        }
      } catch {
        if (controller.signal.aborted) return;
        setAsyncResolution({
          forUsername: username,
          status: "error",
          message: "Failed to check username availability",
        });
      }
    }, USERNAME_VALIDATION_DEBOUNCE_MS);
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [username, syncResult]);

  if (syncResult.kind === "resolved") {
    return {
      validationStatus: syncResult.status,
      validationMessage: syncResult.message,
    };
  }

  if (asyncResolution && asyncResolution.forUsername === username) {
    return {
      validationStatus: asyncResolution.status,
      validationMessage: asyncResolution.message,
    };
  }

  return { validationStatus: "validating", validationMessage: "" };
}
