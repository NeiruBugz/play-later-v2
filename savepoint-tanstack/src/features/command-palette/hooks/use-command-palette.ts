import { useCallback, useEffect, useState } from "react";

/**
 * Custom event channel for opening the palette from outside the component
 * (sidebar search trigger, mobile topbar). Decouples consumers from any
 * provider tree — they can `dispatchEvent(new CustomEvent(...))` without
 * needing the palette in their render tree, and the component just listens.
 *
 * Why an event channel rather than a context provider: the palette mounts
 * once at the root and external triggers (sidebar, topbar) live in widgets
 * that should not depend on a feature's API. The event seam keeps the FSD
 * direction clean: widgets emit; the feature listens.
 */
export const COMMAND_PALETTE_OPEN_EVENT = "savepoint:command-palette:open";

interface UseCommandPaletteReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setOpen: (value: boolean) => void;
}

/**
 * Owns the palette open state plus the global ⌘K / Ctrl+K listener. Mirrors
 * the canonical `savepoint-app/features/command-palette/hooks/use-command-palette.ts`
 * (`metaKey || ctrlKey`, prevent default, toggle).
 */
export function useCommandPalette(): UseCommandPaletteReturn {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    document.addEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
    return () =>
      document.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, handleOpen);
  }, []);

  return { isOpen, open, close, toggle, setOpen: setIsOpen };
}

/**
 * Dispatch the open event from anywhere — used by `AppSidebar` and
 * `AppMobileTopbar` search-trigger buttons.
 */
export function openCommandPalette(): void {
  if (typeof document === "undefined") return;
  document.dispatchEvent(new CustomEvent(COMMAND_PALETTE_OPEN_EVENT));
}
