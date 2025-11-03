"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect } from "react";

import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/ui/utils";

import { useUsernameValidation } from "../hooks/use-username-validation";

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
  const { validationStatus, validationMessage } = useUsernameValidation(value);

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
