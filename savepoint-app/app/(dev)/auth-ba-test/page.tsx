import { auth } from "@/auth.better";
import { env } from "@/env.mjs";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SignInButton } from "./_components/sign-in-button";
import { SignOutButton } from "./_components/sign-out-button";

export default async function AuthBaTestPage() {
  if (env.NODE_ENV === "production") {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto max-w-lg space-y-8 p-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">
          Better Auth — Cognito sign-in test
        </h1>
        <p className="text-muted-foreground text-sm">
          Dev-only side-car. This page exercises the Better Auth Cognito flow in
          parallel with NextAuth — it is{" "}
          <strong>NOT the real login page</strong> and will be deleted in Slice
          8 cleanup. The production auth path remains unchanged at{" "}
          <Link href="/login" className="underline">
            /login
          </Link>
          .
        </p>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h2 className="text-lg font-semibold">BA Session</h2>
        {session?.user ? (
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">User ID:</span>{" "}
              <code className="bg-muted rounded px-1">{session.user.id}</code>
            </p>
            <p>
              <span className="font-medium">Email:</span> {session.user.email}
            </p>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Not signed in</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {!session?.user && <SignInButton />}
        {session?.user && <SignOutButton />}
        <Link href="/login" className="text-muted-foreground text-sm underline">
          Go to NextAuth login (production path)
        </Link>
      </div>
    </main>
  );
}
