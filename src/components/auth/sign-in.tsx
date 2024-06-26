import { signIn } from "@/auth";
import { Button } from "@/src/components/ui/button";

export function SignIn() {
  return (
    <form
      action={async () => {
        "use server";
        await signIn("google", { redirectTo: "/dashboard" });
      }}
    >
      <Button type="submit" variant="outline">
        Sign in
      </Button>
    </form>
  );
}
