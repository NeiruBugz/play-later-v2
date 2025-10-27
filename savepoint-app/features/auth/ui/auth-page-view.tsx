import { env } from "@/env.mjs";

import { Card } from "@/shared/components/ui/card";

import { CredentialsForm } from "./credentials-form";
import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthPageView() {
  const shouldIncludeCredentialsSignIn =
    env.NODE_ENV !== "production" || env.AUTH_ENABLE_CREDENTIALS === "true";

  return (
    <div className="from-muted/40 via-background to-background dark:from-muted/20 dark:via-background dark:to-background flex min-h-screen items-center justify-center bg-linear-to-br p-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-bold">SavePoint</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your gaming experiences
          </p>
        </div>

        {shouldIncludeCredentialsSignIn && (
          <>
            <CredentialsForm />

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-card text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>
          </>
        )}

        <GoogleSignInButton />
      </Card>
    </div>
  );
}
