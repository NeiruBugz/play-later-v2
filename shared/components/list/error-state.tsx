import type { ReactNode } from "react";

type ErrorStateProps = {
  title?: string;
  message?: string;
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again later.",
  action,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-2xl font-semibold text-destructive">{title}</h2>
      {message && (
        <p className="mt-2 max-w-md text-muted-foreground">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

