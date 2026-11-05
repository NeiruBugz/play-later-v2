const TOAST_SELECTOR = "[data-sonner-toast], [data-sonner-toaster]";

type OpenChangeDetails = {
  reason: string;
  event: Event;
  cancel: () => void;
};

export function keepOpenOnToastPress<Details extends OpenChangeDetails>(
  onOpenChange: (open: boolean, details: Details) => void
) {
  return (open: boolean, details: Details): void => {
    const pressedToast =
      !open &&
      details.reason === "outside-press" &&
      details.event.target instanceof Element &&
      details.event.target.closest(TOAST_SELECTOR) !== null;
    if (pressedToast) {
      details.cancel();
      return;
    }
    onOpenChange(open, details);
  };
}
