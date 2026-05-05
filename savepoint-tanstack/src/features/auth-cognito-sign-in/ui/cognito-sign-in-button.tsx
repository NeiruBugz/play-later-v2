import { authClient } from "@/shared/api/auth-client";

export function CognitoSignInButton() {
  const handleSignIn = () => {
    void authClient.signIn.social({
      provider: "cognito",
      callbackURL: "/profile",
    });
  };

  return (
    <button type="button" onClick={handleSignIn}>
      Sign in with Cognito
    </button>
  );
}
