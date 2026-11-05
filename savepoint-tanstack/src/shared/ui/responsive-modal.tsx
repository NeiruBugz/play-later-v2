import {
  createContext,
  useContext,
  type ComponentProps,
  type ReactNode,
} from "react";

import { keepOpenOnToastPress } from "@/shared/lib/keep-open-on-toast-press";
import { useIsDesktop } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./sheet";

const ModalVariantContext = createContext<"dialog" | "sheet">("dialog");

/** Scroll area of a modal body: the sheet's `SheetBody` on phone, a plain block in the dialog. */
export function ModalBody({ className, ...props }: ComponentProps<"div">) {
  const variant = useContext(ModalVariantContext);
  if (variant === "sheet") {
    return <SheetBody className={className} {...props} />;
  }
  return <div className={className} {...props} />;
}

/** Action row of a modal: the sticky safe-area `SheetFooter` on phone, a right-aligned row in the dialog. */
export function ModalFooter({ className, ...props }: ComponentProps<"div">) {
  const variant = useContext(ModalVariantContext);
  if (variant === "sheet") {
    return (
      <SheetFooter
        className={cn("flex-row justify-end gap-1.5 pb-0!", className)}
        {...props}
      />
    );
  }
  return (
    <div
      data-slot="dialog-actions"
      className={cn("flex justify-end gap-1.5", className)}
      {...props}
    />
  );
}

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
  const handleOpenChange = keepOpenOnToastPress(onOpenChange);

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className={cn("pb-safe [--safe-floor:1rem]", contentClassName)}
        data-testid={sheetTestId}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description !== undefined ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        <ModalVariantContext.Provider value="sheet">
          {children}
        </ModalVariantContext.Provider>
      </SheetContent>
    </Sheet>
  );
}
