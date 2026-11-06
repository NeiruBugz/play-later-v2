import type { ComponentProps } from "react";

import { PRODUCT_NAME } from "@/shared/config/site";
import { cn } from "@/shared/lib/utils";

type LogoMarkProps = Omit<ComponentProps<"svg">, "children">;

export function LogoMark({ className, ...props }: LogoMarkProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      data-testid="logo-mark"
      className={cn("size-8 shrink-0", className)}
      {...props}
    >
      <path
        d="M34.2 11.6A15.5 15.5 0 1 0 34.2 36.4"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="36.4" cy="24" r="4.6" fill="currentColor" />
    </svg>
  );
}

type LogoWordmarkProps = ComponentProps<"span"> & {
  markClassName?: string;
};

export function LogoWordmark({
  className,
  markClassName,
  ...props
}: LogoWordmarkProps) {
  return (
    <span
      className={cn("inline-flex items-center gap-2", className)}
      {...props}
    >
      <LogoMark className={markClassName} />
      <span className="font-display leading-none font-bold tracking-tight">
        {PRODUCT_NAME}
      </span>
    </span>
  );
}
