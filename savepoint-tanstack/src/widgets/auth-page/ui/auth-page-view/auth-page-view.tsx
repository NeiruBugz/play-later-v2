import { type ReactNode } from "react";

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
    <div className="px-lg min-h-screen pt-[22vh]">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-2xl">
          <p className="text-display">SavePoint</p>
          <h1 className="text-h1 sr-only">Sign in</h1>
          <p className="text-caption text-muted-foreground mt-sm">
            Your games and the things you&apos;ve thought about them.
          </p>
        </div>

        {notice}

        <div className="space-y-xl">
          {cognitoButton}

          {credentialsForm ? (
            <>
              <div className="gap-md relative flex items-center">
                <div className="bg-border h-px flex-1" />
                <span className="text-caption text-muted-foreground">or</span>
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
