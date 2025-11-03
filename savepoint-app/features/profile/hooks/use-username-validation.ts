import { useEffect, useState } from "react";

import { checkUsernameAvailability } from "../server-actions/check-username-availability";

type ValidationStatus = "idle" | "validating" | "available" | "error";

interface UseUsernameValidationResult {
  validationStatus: ValidationStatus;
  validationMessage: string;
}

/**
 * Custom hook for username validation with debounced availability checking.
 * Uses AbortController to properly cancel in-flight requests and prevent memory leaks.
 *
 * @param username - The username to validate
 * @returns Validation status and message
 */
export function useUsernameValidation(
  username: string
): UseUsernameValidationResult {
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string>("");

  useEffect(() => {
    // Empty username
    if (!username || username.trim().length === 0) {
      setValidationStatus("idle");
      setValidationMessage("");
      return;
    }

    // Length validation (synchronous)
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

    // Show validating state immediately
    setValidationStatus("validating");
    setValidationMessage("");

    // AbortController to cancel async operation on cleanup
    const controller = new AbortController();

    // Debounced availability check
    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability({ username });

        // Check if the request was aborted before updating state
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
        // Check if the request was aborted before updating state
        if (controller.signal.aborted) return;

        setValidationStatus("error");
        setValidationMessage("Failed to check username availability");
      }
    }, 500);

    // Cleanup: abort the async operation and clear timeout
    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [username]);

  return { validationStatus, validationMessage };
}
