import type { RenderWhenProps } from "@/src/types/shared/ui";
import type { PropsWithChildren } from "react";

export function RenderWhen({
  children,
  condition,
  fallback,
}: PropsWithChildren<RenderWhenProps>) {
  if (condition) {
    return children;
  }

  return fallback ?? null;
}
