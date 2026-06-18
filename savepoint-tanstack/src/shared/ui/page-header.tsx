import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export interface PageHeaderProps extends Omit<
  ComponentPropsWithoutRef<"header">,
  "title"
> {
  eyebrow?: ReactNode;
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  sub,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "gap-md mb-6 flex flex-wrap items-end justify-between",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <div className="terminal-label mb-1.5">{eyebrow}</div>
        ) : null}
        <h1 className="text-h1">{title}</h1>
        {sub ? (
          <p className="body-sm text-muted-foreground mt-1.5">{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="gap-sm flex shrink-0 items-center">{actions}</div>
      ) : null}
    </header>
  );
}

PageHeader.displayName = "PageHeader";
