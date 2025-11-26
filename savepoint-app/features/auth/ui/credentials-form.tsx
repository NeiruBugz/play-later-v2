"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import {
  signInSchema,
  signUpSchema,
  type CredentialsFormValues,
} from "../lib/validation";
import { signInAction } from "../server-actions/sign-in";
import { signUpAction } from "../server-actions/sign-up";

export function CredentialsForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const schema = useMemo(
    () => (mode === "signup" ? signUpSchema : signInSchema),
    [mode]
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
    getValues,
    trigger,
    clearErrors,
  } = useForm<CredentialsFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    shouldUnregister: true,
  });
  const toggleMode = useCallback(() => {
    clearErrors();
    setMode((prevMode) => {
      const nextMode = prevMode === "signin" ? "signup" : "signin";
      if (nextMode === "signin") {
        reset({ ...getValues(), name: "" });
      }
      return nextMode;
    });
  }, [clearErrors, getValues, reset]);
  useEffect(() => {
    if (mode === "signup") {
      trigger("password");
    }
  }, [mode, trigger]);
  const onSubmit = handleSubmit(async (values) => {
    clearErrors("root");
    const trimmedName = values.name?.trim();
    const payload = {
      email: values.email.trim(),
      password: values.password,
      ...(trimmedName && { name: trimmedName }),
    };
    try {
      const result =
        mode === "signup"
          ? await signUpAction(payload)
          : await signInAction(payload);
      if (!result.success) {
        setError("root", {
          type: "server",
          message: result.error,
        });
      }
    } catch {
      setError("root", {
        type: "server",
        message: "An unexpected error occurred",
      });
    }
  });
  const passwordHint =
    errors.password?.message ??
    (mode === "signup" ? "Must be at least 8 characters" : undefined);
  return (
    <div>
      {errors.root?.message && (
        <div className="body-sm bg-destructive/10 text-destructive mb-xl p-lg rounded-md">
          {errors.root.message}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-xl" noValidate>
        {mode === "signup" && (
          <div className="space-y-md">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              disabled={isSubmitting}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              {...register("name", {
                setValueAs: (value: string) =>
                  value.trim().length === 0 ? undefined : value,
              })}
            />
            {errors.name?.message && (
              <p
                id="name-error"
                className="caption text-destructive"
                role="alert"
              >
                {errors.name.message}
              </p>
            )}
          </div>
        )}
        <div className="space-y-md">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            required
            {...register("email")}
          />
          {errors.email?.message && (
            <p
              id="email-error"
              className="caption text-destructive"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-md">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            aria-describedby={passwordHint ? "password-hint" : undefined}
            minLength={mode === "signup" ? 8 : undefined}
            required
            {...register("password")}
          />
          {passwordHint ? (
            <p
              id="password-hint"
              className="caption text-muted-foreground"
              role={errors.password ? "alert" : undefined}
            >
              {passwordHint}
            </p>
          ) : null}
        </div>
        <Button
          type="submit"
          className="w-full cursor-pointer"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Loading..."
            : mode === "signin"
              ? "Sign In"
              : "Sign Up"}
        </Button>
      </form>
      <div className="body-sm mt-2xl text-center">
        {mode === "signin" ? (
          <p>
            Don't have an account?{" "}
            <Button
              type="button"
              variant="secondary"
              onClick={toggleMode}
              className="cursor-pointer font-medium"
              disabled={isSubmitting}
            >
              Sign up
            </Button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Button
              type="button"
              onClick={toggleMode}
              variant="secondary"
              className="font-medium"
              disabled={isSubmitting}
            >
              Sign in
            </Button>
          </p>
        )}
      </div>
    </div>
  );
}
