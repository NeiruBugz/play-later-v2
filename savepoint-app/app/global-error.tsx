"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import { useCallback, useEffect } from "react";

import { Button } from "@/shared/components/ui/button";
import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};
const logger = createLogger({
  [LOGGER_CONTEXT.ERROR_BOUNDARY]: "RootGlobalError",
});
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error(
      { err: error, digest: error.digest },
      "Root-level error boundary captured an unhandled error"
    );
  }, [error]);
  const handleReset = useCallback(() => {
    logger.info(
      { digest: error.digest },
      "Root-level error boundary retry requested"
    );
    reset();
  }, [error, reset]);
  return (
    <html lang="en">
      <body>
        <main className="bg-background text-foreground relative flex min-h-screen flex-1 items-center justify-center overflow-hidden px-lg py-5xl sm:px-2xl lg:px-3xl">
          <div className="from-background via-background to-muted pointer-events-none absolute inset-0 bg-linear-to-br opacity-60" />
          <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-2xl text-center">
            <span className="bg-destructive/10 text-destructive inline-flex items-center gap-md rounded-full px-lg py-sm text-sm font-medium">
              <ShieldAlert
                className="h-4 w-4"
                aria-hidden="true"
                data-testid="global-error-shield-icon"
              />
              Critical Error
            </span>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Something went critically wrong.
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A critical error occurred in the application. You can try again,
              or refresh your browser to restart the application.
            </p>
            <div className="flex w-full flex-col-reverse gap-lg sm:flex-row sm:items-center sm:justify-center">
              <Button
                onClick={() => window.location.reload()}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Refresh page
              </Button>
              <Button
                onClick={handleReset}
                size="lg"
                className="w-full sm:w-auto"
              >
                Try again
              </Button>
            </div>
            {error.digest && (
              <p className="text-muted-foreground text-sm">
                Error reference:{" "}
                <span className="font-mono">{error.digest}</span>
              </p>
            )}
          </div>
        </main>
      </body>
    </html>
  );
}
