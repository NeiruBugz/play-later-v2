import { Card } from "@/shared/components/ui/card";

import { CredentialsForm } from "./credentials-form";
import { GoogleSignInButton } from "./google-sign-in-button";

export function AuthPageView() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 text-center">
          <h1 className="font-serif text-3xl font-bold">SavePoint</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Manage your gaming experiences
          </p>
        </div>

        <CredentialsForm />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background text-muted-foreground px-2">
              Or continue with
            </span>
          </div>
        </div>

        <GoogleSignInButton />
      </Card>
    </div>
  );
}
