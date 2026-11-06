import {
  createFileRoute,
  Link,
  redirect,
  type ErrorComponentProps,
} from "@tanstack/react-router";

import { getProfileSetupStatusFn } from "@/features/setup-profile/api/get-profile-setup-status";
import { AppError } from "@/shared/lib/errors";
import { buttonVariants } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header";
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

function ProfileSetupErrorBoundary({ error }: ErrorComponentProps) {
  const isUnauthorized =
    error instanceof AppError && error.code === "UNAUTHORIZED";

  if (isUnauthorized) {
    return (
      <div
        role="alert"
        className="container mx-auto flex flex-col gap-2 px-4 py-12"
      >
        <PageHeader title="Sign in required" className="mb-0" />
        <p>Please sign in to finish setting up your profile.</p>
        <Link to="/login" className={buttonVariants({ variant: "outline" })}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className="container mx-auto flex flex-col gap-2 px-4 py-12"
    >
      <PageHeader title="Something went wrong" className="mb-0" />
      <p>We couldn't load profile setup. Please try again.</p>
      <Link to="/dashboard" className={buttonVariants({ variant: "outline" })}>
        Back to Home
      </Link>
    </div>
  );
}
