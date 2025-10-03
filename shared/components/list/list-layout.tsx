"use client";

import type { ReactNode } from "react";

type ListLayoutProps = {
  title?: ReactNode;
  subtitle?: ReactNode;
  controls?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

export function ListLayout({
  title,
  subtitle,
  controls,
  children,
  footer,
}: ListLayoutProps) {
  return (
    <div className="container overflow-hidden px-4 py-8 pt-[60px]">
      {(title || subtitle) && (
        <div className="mb-6 flex flex-col gap-2">
          {title}
          {subtitle}
        </div>
      )}
      {controls && <div className="mb-6">{controls}</div>}
      <div className="space-y-6">{children}</div>
      {footer && <div className="mt-6 flex justify-center">{footer}</div>}
    </div>
  );
}

