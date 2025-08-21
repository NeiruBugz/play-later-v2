import { signIn } from "@/auth";
import React from "react";

import { Button } from "@/shared/components/ui/button";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button type="submit" size="lg" variant="outline">
        Sign In with Google
      </Button>
    </form>
  );
}
