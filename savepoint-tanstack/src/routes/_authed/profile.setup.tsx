import { createFileRoute, Link, redirect } from "@tanstack/react-router";

import { getProfileSetupStatusFn } from "@/features/setup-profile/api/get-profile-setup-status";
import { AppError } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { ProfileSetupForm } from "@/widgets/profile-setup-page";

/**
 * `/profile/setup` — first-run profile-setup page (Slice 23, blocker
 * remediation #2). Mirrors `savepoint-app`'s
 * `app/(protected)/profile/setup/page.tsx`.
 *
 * The loader reads setup status via the loader-safe `getProfileSetupStatusFn`
 * (foot-gun #2: route loaders must not import `.server.ts` modules directly).
 * If the user has already completed setup (`!needsSetup`), we redirect to
 * `/dashboard` to match canonical. Otherwise the loader hands the suggested
 * username to the setup form.
 *
 * `/profile` repoints its no-username branch here (replacing the earlier
 * `/settings/profile` bounce).
 */
export const Route = createFileRoute("/_authed/profile/setup")({
  loader: async () => {
    const { needsSetup, suggestedUsername } = await getProfileSetupStatusFn();
    if (!needsSetup) {
      throw redirect({ to: "/dashboard" });
    }
    return { suggestedUsername };
  },
  component: ProfileSetupRoute,
  errorComponent: ProfileSetupErrorBoundary,
});

function ProfileSetupRoute() {
  const { suggestedUsername } = Route.useLoaderData();

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <ProfileSetupForm defaultUsername={suggestedUsername} />
    </div>
  );
}

function ProfileSetupErrorBoundary({ error }: { error: Error }) {
  const isUnauthorized =
    error instanceof AppError && error.code === "UNAUTHORIZED";

  if (isUnauthorized) {
    return (
      <main
        role="alert"
        className="gap-md container mx-auto flex flex-col px-4 py-12"
      >
        <h1 className="text-h2">Sign in required</h1>
        <p>Please sign in to finish setting up your profile.</p>
        <Button asChild variant="outline">
          <Link to="/login">Go to sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main
      role="alert"
      className="gap-md container mx-auto flex flex-col px-4 py-12"
    >
      <h1 className="text-h2">Something went wrong</h1>
      <p>We couldn't load profile setup. Please try again.</p>
      <Button asChild variant="outline">
        <Link to="/dashboard">Back to dashboard</Link>
      </Button>
    </main>
  );
}
