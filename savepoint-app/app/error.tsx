"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";

import { BrowserBackButton } from "@/shared/components/browser-back-button";
import { Button } from "@/shared/components/ui/button";
import { createLogger } from "@/shared/lib/app/logger";
import { LOGGER_CONTEXT } from "@/shared/lib/app/logger-context";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};
const logger = createLogger({ [LOGGER_CONTEXT.ERROR_BOUNDARY]: "GlobalError" });
export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    logger.error(
      { err: error, digest: error.digest },
      "Global error boundary captured an unhandled error"
    );
  }, [error]);
  const handleReset = useCallback(() => {
    logger.info(
      { digest: error.digest },
      "Global error boundary retry requested"
    );
    reset();
  }, [error, reset]);
  return (
    <main className="px-lg py-5xl sm:px-2xl lg:px-3xl relative flex flex-1 items-center justify-center overflow-hidden">
      <div className="from-background via-background to-muted pointer-events-none absolute inset-0 bg-linear-to-br opacity-60" />
      <div className="gap-2xl relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <span className="bg-destructive/10 text-destructive gap-md px-lg py-sm inline-flex items-center rounded-full text-sm font-medium">
          <ShieldAlert
            className="h-4 w-4"
            aria-hidden="true"
            data-testid="error-shield-icon"
          />
          Something went wrong
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          We hit an unexpected error.
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          The action you tried didn&apos;t go as planned. You can try again, or
          head back to a safe spot while we make sure everything is in order.
        </p>
        <div className="gap-lg flex w-full flex-col-reverse sm:flex-row sm:items-center sm:justify-center">
          <BrowserBackButton />
          <Button
            onClick={handleReset}
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
        <p className="text-muted-foreground text-sm">
          Error reference:{" "}
          <span className="font-mono">{error.digest ?? "N/A"}</span>
        </p>
      </div>
    </main>
  );
}
