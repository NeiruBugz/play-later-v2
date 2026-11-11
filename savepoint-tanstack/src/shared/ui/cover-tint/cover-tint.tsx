import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

export type CoverTintValue = { hue: number; chroma: number };

export type CoverTintProps = {
  tint: CoverTintValue | null;
  variant: "panel" | "header";
  children?: ReactNode;
  className?: string;
};

export function CoverTint({
  tint,
  variant,
  children,
  className,
}: CoverTintProps) {
  const style = tint
    ? ({ "--tint-h": tint.hue, "--tint-c": tint.chroma } as CSSProperties)
    : undefined;

  return (
    <div
      data-tint={tint ? "on" : "off"}
      data-variant={variant}
      style={style}
      className={cn("cover-tint", className)}
    >
      {children}
    </div>
  );
}
