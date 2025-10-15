"use client";

import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

import { signInAction } from "../server-actions/sign-in";
import { signUpAction } from "../server-actions/sign-up";

export function CredentialsForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError("");
  };

  const handleSignUpAction = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name?: string;
  }) => {
    const result = await signUpAction({ email, password, name });
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleSignInAction = async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }) => {
    const result = await signInAction({ email, password });
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    setError("");
    setLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string | undefined;

    try {
      if (mode === "signup") {
        await handleSignUpAction({ email, password, name });
      } else {
        await handleSignInAction({ email, password });
      }
    } catch (error) {
      console.log(error);
      setError("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-destructive/10 text-destructive mb-4 rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Name (Optional)</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              disabled={loading}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            disabled={loading}
            minLength={mode === "signup" ? 8 : undefined}
          />
          {mode === "signup" && (
            <p className="text-muted-foreground text-xs">
              Must be at least 8 characters
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Sign Up"}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        {mode === "signin" ? (
          <p>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary font-medium hover:underline"
              disabled={loading}
            >
              Sign up
            </button>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={toggleMode}
              className="text-primary font-medium hover:underline"
              disabled={loading}
            >
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
