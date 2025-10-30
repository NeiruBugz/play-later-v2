"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/ui/utils";

import { checkUsernameAvailability } from "../server-actions/check-username-availability";

type ValidationStatus = "idle" | "validating" | "available" | "error";

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string; // External validation errors (optional)
  disabled?: boolean;
  onValidationChange?: (hasError: boolean) => void; // Callback to notify parent of validation state
}

export function UsernameInput({
  value,
  onChange,
  label = "Username",
  error: externalError,
  disabled = false,
  onValidationChange,
}: UsernameInputProps) {
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("idle");
  const [validationMessage, setValidationMessage] = useState<string>("");

  useEffect(() => {
    if (!value || value.trim().length === 0) {
      setValidationStatus("idle");
      setValidationMessage("");
      return;
    }

    if (value.length < 3) {
      setValidationStatus("error");
      setValidationMessage("Username must be at least 3 characters");
      return;
    }

    if (value.length > 25) {
      setValidationStatus("error");
      setValidationMessage("Username must not exceed 25 characters");
      return;
    }

    // Show validating state immediately
    setValidationStatus("validating");
    setValidationMessage("");

    const timeoutId = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailability({ username: value });

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
        setValidationStatus("error");
        setValidationMessage("Failed to check username availability");
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value]);

  const displayError = externalError || validationMessage;
  const showError =
    (externalError || validationStatus === "error") && displayError;
  const showSuccess = !externalError && validationStatus === "available";

  // Notify parent component of validation state changes
  useEffect(() => {
    if (onValidationChange) {
      // Only report actual errors, not validating state
      const hasError = Boolean(showError);
      onValidationChange(hasError);
    }
  }, [showError, onValidationChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor="username">{label}</Label>
      <div className="relative">
        <Input
          id="username"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "pr-10",
            showError &&
              "border-red-500 focus-visible:ring-red-500 dark:border-red-400 dark:focus-visible:ring-red-400",
            showSuccess &&
              "border-emerald-500 focus-visible:ring-emerald-500 dark:border-emerald-400 dark:focus-visible:ring-emerald-400"
          )}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby="username-error"
          placeholder="Enter username"
          autoComplete="username"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {validationStatus === "validating" && (
            <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
          )}
          {showSuccess && (
            <Check className="h-4 w-4 text-emerald-500 dark:text-emerald-300" />
          )}
          {showError && validationStatus === "error" && (
            <X className="h-4 w-4 text-red-500 dark:text-red-400" />
          )}
        </div>
      </div>
      {showError && (
        <p
          className="text-sm text-red-500 dark:text-red-400"
          id="username-error"
        >
          {displayError}
        </p>
      )}
      {showSuccess && (
        <p
          className="text-sm text-emerald-600 dark:text-emerald-300"
          role="status"
        >
          {validationMessage}
        </p>
      )}
    </div>
  );
}
