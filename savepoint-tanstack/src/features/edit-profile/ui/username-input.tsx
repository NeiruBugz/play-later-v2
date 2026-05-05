import { Check, Loader2, X } from "lucide-react";

import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

import { useUsernameValidation } from "../model/use-username-validation";

type UsernameInputProps = {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  currentUsername?: string;
};

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
    <div className="space-y-md">
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
              className="text-muted-foreground h-4 w-4 animate-spin"
              aria-label="Validating username"
            />
          )}
          {validationStatus === "available" && (
            <Check
              className="text-success h-4 w-4"
              aria-label="Username available"
            />
          )}
          {validationStatus === "error" && (
            <X
              className="text-destructive h-4 w-4"
              aria-label="Username error"
            />
          )}
        </div>
      </div>
      {validationStatus === "error" && (
        <p className="text-destructive text-sm" role="alert">
          {validationMessage}
        </p>
      )}
      {validationStatus === "available" && (
        <p className="text-success text-sm" role="status">
          {validationMessage}
        </p>
      )}
    </div>
  );
}
