"use client";

import { Check, Loader2, X } from "lucide-react";
import { useEffect } from "react";

import { useUsernameValidation } from "@/features/setup-profile/hooks/use-username-validation";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { cn } from "@/shared/lib/ui/utils";

import type { UsernameInputProps } from "./username-input.types";

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
  useEffect(() => {
    if (onValidationChange) {
      const hasError = Boolean(showError);
      onValidationChange(hasError);
    }
  }, [showError, onValidationChange]);
  return (
    <div className="space-y-md">
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
            showError && "border-destructive focus-visible:ring-destructive",
            showSuccess && "border-success focus-visible:ring-success"
          )}
          aria-invalid={showError ? "true" : "false"}
          aria-describedby="username-error"
          placeholder="Enter username"
          autoComplete="username"
          required
        />
        <div className="pr-lg pointer-events-none absolute inset-y-0 right-0 flex items-center">
          {validationStatus === "validating" && (
            <Loader2
              className="text-muted-foreground h-4 w-4 animate-spin"
              aria-label="Validating username"
              data-testid="username-validating-spinner"
            />
          )}
          {showSuccess && (
            <Check
              className="text-success h-4 w-4"
              aria-label="Username available"
              data-testid="username-success-icon"
            />
          )}
          {showError && validationStatus === "error" && (
            <X
              className="text-destructive h-4 w-4"
              aria-label="Username error"
              data-testid="username-error-icon"
            />
          )}
        </div>
      </div>
      {showError && (
        <p className="text-destructive text-sm" id="username-error">
          {displayError}
        </p>
      )}
      {showSuccess && (
        <p className="text-success text-sm" role="status">
          {validationMessage}
        </p>
      )}
    </div>
  );
}
