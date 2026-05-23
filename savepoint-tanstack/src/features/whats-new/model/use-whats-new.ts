import { useCallback, useEffect, useState } from "react";

import { CURRENT_VERSION, WHATS_NEW_STORAGE_KEY } from "../config";

interface UseWhatsNewReturn {
  isOpen: boolean;
  dismiss: () => void;
}

// Reads the last-seen version from localStorage on mount. The modal opens
// iff the stored value !== CURRENT_VERSION (covers both "empty" and
// "stale"). Synchronous on mount — no setTimeout — so component tests do
// not need to coordinate with fake-timer drain semantics beyond what the
// unit setup already provides.
//
// SSR-safe: localStorage reads are guarded by `typeof window`. The hook
// is only ever rendered inside `RootShell` after the user-auth check, so
// in practice it never executes on the server path that hits this guard,
// but the guard keeps the module-load surface SSR-clean either way.
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
