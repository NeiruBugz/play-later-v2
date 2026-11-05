import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

type InteractOutsideHandler = (event: Event) => void;

const InteractOutsideContext = React.createContext<React.RefObject<
  InteractOutsideHandler | undefined
> | null>(null);

function Dialog({
  onOpenChange,
  ...props
}: Omit<React.ComponentProps<typeof DialogPrimitive.Root>, "onOpenChange"> & {
  onOpenChange?: (open: boolean) => void;
}) {
  const interactOutsideRef = React.useRef<InteractOutsideHandler | undefined>(
    undefined
  );

  const handleOpenChange: NonNullable<
    React.ComponentProps<typeof DialogPrimitive.Root>["onOpenChange"]
  > = (open, details) => {
    if (
      !open &&
      details.reason === "outside-press" &&
      interactOutsideRef.current
    ) {
      let prevented = false;
      interactOutsideRef.current({
        target: details.event.target,
        preventDefault: () => {
          prevented = true;
        },
      } as unknown as Event);
      if (prevented) {
        details.cancel();
        return;
      }
    }
    onOpenChange?.(open);
  };

  return (
    <InteractOutsideContext.Provider value={interactOutsideRef}>
      <DialogPrimitive.Root {...props} onOpenChange={handleOpenChange} />
    </InteractOutsideContext.Provider>
  );
}

function useRegisterInteractOutside(handler?: InteractOutsideHandler) {
  const ref = React.useContext(InteractOutsideContext);
  React.useEffect(() => {
    if (!ref) return;
    ref.current = handler;
    return () => {
      ref.current = undefined;
    };
  }, [ref, handler]);
}

type InteractOutsideProps = { onInteractOutside?: InteractOutsideHandler };

function DialogTrigger({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger> & {
  asChild?: boolean;
}) {
  const child = asChild && React.isValidElement(children) ? children : null;
  return child ? (
    <DialogPrimitive.Trigger render={child} {...props} />
  ) : (
    <DialogPrimitive.Trigger {...props}>{children}</DialogPrimitive.Trigger>
  );
}

function DialogClose({
  asChild = false,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close> & {
  asChild?: boolean;
}) {
  const child = asChild && React.isValidElement(children) ? children : null;
  return child ? (
    <DialogPrimitive.Close render={child} {...props} />
  ) : (
    <DialogPrimitive.Close {...props}>{children}</DialogPrimitive.Close>
  );
}

const DialogPortal = DialogPrimitive.Portal;

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Backdrop>) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
        className
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Popup> & InteractOutsideProps) {
  useRegisterInteractOutside(onInteractOutside);
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Popup
        className={cn(
          "bg-background data-[open]:animate-in data-[closed]:animate-out data-[closed]:fade-out-0 data-[open]:fade-in-0 data-[closed]:zoom-out-95 data-[open]:zoom-in-95 data-[closed]:slide-out-to-left-1/2 data-[closed]:slide-out-to-top-[48%] data-[open]:slide-in-from-left-1/2 data-[open]:slide-in-from-top-[48%] gap-xl p-2xl fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border shadow-lg duration-200 sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPortal>
  );
}

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "space-y-sm flex flex-col text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "sm:space-x-md flex flex-col-reverse sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-lg leading-none font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  useRegisterInteractOutside,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
