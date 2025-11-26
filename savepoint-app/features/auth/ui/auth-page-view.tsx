import { env } from "@/env.mjs";

import { Card } from "@/shared/components/ui/card";

import { CredentialsForm } from "./credentials-form";
import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthPageView() {
  const shouldIncludeCredentialsSignIn =
    env.NODE_ENV !== "production" || env.AUTH_ENABLE_CREDENTIALS === "true";
  return (
    <div className="from-muted/40 via-background to-background dark:from-muted/20 dark:via-background dark:to-background p-lg flex min-h-screen items-center justify-center bg-linear-to-br">
      <Card className="p-3xl w-full max-w-md">
        <div className="mb-2xl text-center">
          <h1 className="font-serif text-3xl font-bold">SavePoint</h1>
          <p className="body-sm text-muted-foreground mt-md">
            Manage your gaming experiences
          </p>
        </div>
        {shouldIncludeCredentialsSignIn && (
          <>
            <CredentialsForm />
            <div className="my-2xl relative">
              <div className="absolute inset-0 flex items-center">
                <div className="border-border w-full border-t" />
              </div>
              <div className="body-sm relative flex justify-center">
                <span className="bg-card text-muted-foreground px-md">
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
