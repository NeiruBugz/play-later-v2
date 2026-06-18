import type { ReactNode } from "react";

import { useIsDesktop } from "@/shared/lib/use-media-query";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";

export type ResponsiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Extra classes applied to the content container of both variants. */
  contentClassName?: string;
  /** `data-testid` applied to the desktop Dialog content. */
  dialogTestId?: string;
  /** `data-testid` applied to the mobile Sheet content. */
  sheetTestId?: string;
};

/**
 * One overlay shell that renders a centered `Dialog` on desktop and a bottom
 * `Sheet` on mobile, picking the variant via `useIsDesktop()`. Collapses the
 * Dialog/Sheet fork that the global action host and the journal compose dialog
 * each used to hand-roll, so the header wiring + a11y title/description live in
 * one place.
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  contentClassName,
  dialogTestId,
  sheetTestId,
}: ResponsiveModalProps) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={contentClassName} data-testid={dialogTestId}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description !== undefined ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className={contentClassName}
        data-testid={sheetTestId}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description !== undefined ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
