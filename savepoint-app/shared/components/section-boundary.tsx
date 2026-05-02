"use client";

import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { Button } from "@/shared/components/ui/button";

type SectionBoundaryProps = {
  children: React.ReactNode;
  label?: string;
};

function SectionFallback({
  resetErrorBoundary,
  label,
}: FallbackProps & { label?: string }) {
  return (
    <div
      role="alert"
      className="bg-card border-border p-md flex flex-col items-start gap-2 rounded-lg border"
    >
      <p className="text-muted-foreground text-sm">
        {label ?? "Couldn't load this section."}
      </p>
      <Button size="sm" variant="outline" onClick={resetErrorBoundary}>
        Retry
      </Button>
    </div>
  );
}

function logSectionError(error: unknown) {
  console.error("[SectionBoundary]", error);
}

export function SectionBoundary({ children, label }: SectionBoundaryProps) {
  return (
    <ErrorBoundary
      onError={logSectionError}
      fallbackRender={(props) => <SectionFallback {...props} label={label} />}
    >
      {children}
    </ErrorBoundary>
  );
}
