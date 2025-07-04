import { signIn } from "@/auth";
import { Button } from "@/shared/components";
import { cn } from "@/shared/lib";
import React from "react";

export function SignIn({ variant }: { variant: "default" | "start" }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
    >
      <Button
        type="submit"
        size="lg"
        className={cn({
          "bg-white text-green-900 hover:bg-gray-200": variant === "default",
        })}
      >
        Sign In with Google
      </Button>
    </form>
  );
}
