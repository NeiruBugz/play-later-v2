import { useEffect, useState } from "react";

import { checkUsernameAvailability } from "../server-actions/check-username-availability";

type ValidationStatus = "idle" | "validating" | "available" | "error";

interface UseUsernameValidationResult {
  validationStatus: ValidationStatus;
  validationMessage: string;
}

export function useUsernameValidation(
  username: string
): UseUsernameValidationResult {
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string>("");

  useEffect(() => {
    if (!username || username.trim().length === 0) {
      setValidationStatus("idle");
      setValidationMessage("");
      return;
    }

    if (username.length < 3) {
      setValidationStatus("error");
      setValidationMessage("Username must be at least 3 characters");
      return;
    }

    if (username.length > 25) {
      setValidationStatus("error");
      setValidationMessage("Username must not exceed 25 characters");
      return;
    }

    setValidationStatus("validating");
    setValidationMessage("");

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability({ username });

        if (controller.signal.aborted) return;

        if (result.success) {
          if (result.available) {
            setValidationStatus("available");
            setValidationMessage("Username available");
          } else {
            setValidationStatus("error");
            setValidationMessage("Username already exists");
          }
        } else {
          setValidationStatus("error");
          setValidationMessage(result.error);
        }
      } catch {
        if (controller.signal.aborted) return;

        setValidationStatus("error");
        setValidationMessage("Failed to check username availability");
      }
    }, 500);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [username]);

  return { validationStatus, validationMessage };
}
