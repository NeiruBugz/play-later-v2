import { createFileRoute } from "@tanstack/react-router";

import { CognitoSignInButton } from "@/features/auth-cognito-sign-in/ui/cognito-sign-in-button";
import { getCredentialsEnabledFn } from "@/features/auth-email-sign-in/api/get-credentials-enabled";
import { EmailSignInForm } from "@/features/auth-email-sign-in/ui/email-sign-in-form";

export const Route = createFileRoute("/login")({
  loader: () => getCredentialsEnabledFn(),
  component: LoginPage,
});

function LoginPage() {
  const { credentialsEnabled } = Route.useLoaderData();

  return (
    <main>
      <h1>Sign in</h1>
      <CognitoSignInButton />
      <EmailSignInForm enabled={credentialsEnabled} />
    </main>
  );
}
