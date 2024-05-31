import type { PropsWithChildren } from "react";

import type { RenderWhenProps } from "@/src/shared/types/shared/ui";

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
