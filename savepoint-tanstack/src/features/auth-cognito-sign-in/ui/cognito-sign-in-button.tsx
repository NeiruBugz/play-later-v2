import { authClient } from "@/shared/api/auth-client";
import { Button } from "@/shared/ui/button";

export function CognitoSignInButton() {
  const handleSignIn = () => {
    void authClient.signIn.social({
      provider: "cognito",
      callbackURL: "/profile",
    });
  };

  return (
    <Button type="button" onClick={handleSignIn}>
      Sign in with Cognito
    </Button>
  );
}
