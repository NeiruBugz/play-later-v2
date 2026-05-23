import { useEffect, useState } from "react";

/**
 * useMediaQuery — subscribes to a CSS media-query string and returns
 * whether it currently matches. SSR-safe (always false on the server).
 *
 * Local to `features/command-palette` since the desktop/mobile shell
 * split is the only consumer in tanstack today. Lift to `shared/lib/`
 * if a second consumer appears.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);

  return matches;
}
