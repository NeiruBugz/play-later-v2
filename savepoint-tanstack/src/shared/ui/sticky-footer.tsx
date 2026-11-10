import { useEffect, useRef, useState, type ComponentProps } from "react";

import { cn } from "@/shared/lib/utils";

export type StickyFooterProps = ComponentProps<"div"> & {
  /** Set on screens where the fixed bottom nav is visible: pins the footer above it instead of at the viewport edge. */
  aboveBottomNav?: boolean;
};

export function StickyFooter({
  aboveBottomNav = false,
  className,
  ...props
}: StickyFooterProps) {
  const footerRef = useRef<HTMLDivElement>(null);
  const [reservedHeight, setReservedHeight] = useState<number | null>(null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const observer = new ResizeObserver(() => {
      setReservedHeight(footer.getBoundingClientRect().height);
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        aria-hidden
        data-slot="sticky-footer-spacer"
        className="h-17 md:hidden"
        style={reservedHeight === null ? undefined : { height: reservedHeight }}
      />
      <div
        ref={footerRef}
        data-slot="sticky-footer"
        className={cn(
          "max-md:fixed max-md:inset-x-0 max-md:z-30 max-md:border-t max-md:bg-background max-md:px-4 max-md:pt-3",
          aboveBottomNav
            ? "max-md:bottom-(--bottom-nav-height) max-md:pb-3"
            : "max-md:bottom-0 max-md:pb-safe max-md:[--safe-floor:0.75rem]",
          className
        )}
        {...props}
      />
    </>
  );
}
