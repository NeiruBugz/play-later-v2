import { Check, Loader2, X } from "lucide-react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { useUsernameValidation } from "../../model/use-username-validation";
import type { UsernameInputProps } from "./username-input.type";

export function UsernameInput({
  value,
  onChange,
  id = "username",
  currentUsername,
}: UsernameInputProps) {
  const { validationStatus, validationMessage } = useUsernameValidation(
    value,
    currentUsername
  );

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Username</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={validationStatus === "error"}
          autoComplete="username"
          placeholder="Enter username"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          {validationStatus === "validating" && (
            <Loader2
              className="h-4 w-4 animate-spin text-muted-foreground"
              aria-label="Validating username"
            />
          )}
          {validationStatus === "available" && (
            <Check
              className="h-4 w-4 text-success"
              aria-label="Username available"
            />
          )}
          {validationStatus === "error" && (
            <X
              className="h-4 w-4 text-destructive"
              aria-label="Username error"
            />
          )}
        </div>
      </div>
      {validationStatus === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {validationMessage}
        </p>
      )}
      {validationStatus === "available" && (
        <p className="text-sm text-success" role="status">
          {validationMessage}
        </p>
      )}
    </div>
  );
}
