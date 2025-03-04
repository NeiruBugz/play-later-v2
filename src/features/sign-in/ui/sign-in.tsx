import { signIn } from "@/auth";
import { cn } from "@/src/shared/lib";
import { Button } from "@/src/shared/ui";
import React from "react";

export function SignIn({ variant }: { variant: "default" | "start" }) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google");
      }}
      className="mt-2"
    >
      <Button
        type="submit"
        size="lg"
        className={cn({
          "bg-white text-green-900 hover:bg-gray-200": variant === "default",
          "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:bg-green-700":
            variant === "start",
        })}
      >
        Sign In with Google
      </Button>
    </form>
  );
}
