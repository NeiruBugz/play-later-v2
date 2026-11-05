import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export interface PageHeaderProps extends Omit<
  ComponentPropsWithoutRef<"header">,
  "title"
> {
  title: ReactNode;
  sub?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  sub,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-2",
        className
      )}
      {...props}
    >
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight break-words md:text-3xl">
          {title}
        </h1>
        {sub ? (
          <p className="text-muted-foreground mt-1.5 text-sm">{sub}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
      ) : null}
    </header>
  );
}

PageHeader.displayName = "PageHeader";
