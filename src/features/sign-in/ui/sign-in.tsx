import { signIn } from "@/auth";
import { Button } from "@/src/shared/ui/button";
import React from "react";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
      className="mt-2"
    >
      <Button type="submit" variant="outline">
        Sign In with Google
      </Button>
    </form>
  );
}
