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
    >
      <Button type="submit">Signin with Google</Button>
    </form>
  );
}
