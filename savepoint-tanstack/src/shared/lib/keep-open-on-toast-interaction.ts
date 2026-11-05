const TOAST_SELECTOR = "[data-sonner-toast], [data-sonner-toaster]";

type OutsideInteractionEvent = Event & {
  detail?: { originalEvent?: Event };
};

export function keepOpenOnToastInteraction(
  event: OutsideInteractionEvent
): void {
  const target = event.detail?.originalEvent?.target ?? event.target;
  if (target instanceof Element && target.closest(TOAST_SELECTOR)) {
    event.preventDefault();
  }
}
