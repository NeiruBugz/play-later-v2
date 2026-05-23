import { useEffect, useState } from "react";

import { USERNAME_VALIDATION_DEBOUNCE_MS } from "@/shared/lib/constants";

import { checkUsernameFn } from "../api/update-profile";

type ValidationStatus = "idle" | "validating" | "available" | "error";

const MESSAGES: Record<ValidationStatus, string> = {
  idle: "",
  validating: "",
  available: "Username available",
  error: "Username already exists",
};

export function useUsernameValidation(
  username: string,
  currentUsername?: string
): { validationStatus: ValidationStatus; validationMessage: string } {
  const [status, setStatus] = useState<ValidationStatus>("idle");

  useEffect(() => {
    if (!username || username === currentUsername) {
      setStatus("idle");
      return;
    }

    setStatus("validating");
    let cancelled = false;
    const timer = setTimeout(async () => {
      const { available } = await checkUsernameFn({ data: { username } });
      if (cancelled) return;
      setStatus(available ? "available" : "error");
    }, USERNAME_VALIDATION_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [username, currentUsername]);

  return { validationStatus: status, validationMessage: MESSAGES[status] };
}
