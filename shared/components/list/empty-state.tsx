import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <h2 className="text-2xl font-semibold">{title}</h2>
      {description && (
        <div className="mt-2 max-w-md text-muted-foreground">{description}</div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
