import { type ReactNode } from "react";

import { PageHeader } from "@/shared/ui/page-header";

type AuthPageViewProps = {
  cognitoButton: ReactNode;
  credentialsForm?: ReactNode;
  notice?: ReactNode;
};

export function AuthPageView({
  cognitoButton,
  credentialsForm,
  notice,
}: AuthPageViewProps) {
  return (
    <div className="min-h-screen px-3 pt-[22vh]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6">
          <p className="font-display text-5xl font-bold tracking-tight">
            SavePoint
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs font-medium">
            Your games and the things you&apos;ve thought about them.
          </p>
        </div>

        <PageHeader title="Sign in" />

        {notice}

        <div className="space-y-4">
          {cognitoButton}

          {credentialsForm ? (
            <>
              <div className="relative flex items-center gap-2">
                <div className="bg-border h-px flex-1" />
                <span className="text-muted-foreground text-xs font-medium">
                  or
                </span>
                <div className="bg-border h-px flex-1" />
              </div>
              {credentialsForm}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
