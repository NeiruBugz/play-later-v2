import { useCallback, useEffect, useState } from "react";

import { CURRENT_VERSION, WHATS_NEW_STORAGE_KEY } from "../config";

interface UseWhatsNewReturn {
  isOpen: boolean;
  dismiss: () => void;
}

// Opens synchronously on mount (no setTimeout) so component tests need no
// fake-timer coordination. The `typeof window` guard keeps the module-load
// surface SSR-clean even though the hook only renders after the auth check.
export function useWhatsNew(): UseWhatsNewReturn {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(WHATS_NEW_STORAGE_KEY);
    } catch {
      // localStorage unavailable (private mode, quota); treat as unseen.
      stored = null;
    }
    if (stored !== CURRENT_VERSION) {
      setIsOpen(true);
    }
  }, []);

  const dismiss = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(WHATS_NEW_STORAGE_KEY, CURRENT_VERSION);
      } catch {
        // localStorage write failed; still close the modal so the user is
        // not trapped behind it. They'll see it again next visit.
      }
    }
    setIsOpen(false);
  }, []);

  return { isOpen, dismiss };
}
