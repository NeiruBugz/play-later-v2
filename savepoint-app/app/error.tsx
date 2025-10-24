"use client";

import { RefreshCw, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect } from "react";

import { Button } from "@/shared/components/ui/button";
import { createLogger } from "@/shared/lib/app/logger";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const logger = createLogger({ component: "GlobalError" });

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
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
      <div className="from-background via-background to-muted pointer-events-none absolute inset-0 bg-linear-to-br opacity-60" />
      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center gap-6 text-center">
        <span className="bg-destructive/10 text-destructive inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium">
          <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          Something went wrong
        </span>

        <h1 className="font-serif text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          We hit an unexpected error.
        </h1>

        <p className="text-muted-foreground text-lg leading-relaxed">
          The action you tried didn&apos;t go as planned. You can try again, or
          head back to a safe spot while we make sure everything is in order.
        </p>

        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-center">
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
