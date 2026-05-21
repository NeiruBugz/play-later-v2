import { createFileRoute, redirect } from "@tanstack/react-router";

import { getCurrentUserIdFn } from "@/entities/session/api/get-current-user-id";
import { CognitoSignInButton } from "@/features/auth-cognito-sign-in/ui/cognito-sign-in-button";
import { EmailSignInForm } from "@/features/auth-email-sign-in/ui/email-sign-in-form";
import { AuthPageView } from "@/widgets/auth-page";
import { getEmailSignInEnabledFn } from "#/features/auth-email-sign-in/api/get-email-sign-in-enabled";

export const Route = createFileRoute("/login")({
  beforeLoad: async () => {
    const { userId } = await getCurrentUserIdFn();
    if (userId) {
      throw redirect({ to: "/dashboard" });
    }
  },
  loader: () => getEmailSignInEnabledFn(),
  component: LoginPage,
});

function LoginPage() {
  const { credentialsEnabled } = Route.useLoaderData();

  return (
    <AuthPageView
      cognitoButton={<CognitoSignInButton />}
      credentialsForm={
        credentialsEnabled ? <EmailSignInForm enabled /> : undefined
      }
    />
  );
}
