import { useEffect, useState } from "react";

/**
 * Debounce a value. Returns the input value after `delay` ms have elapsed
 * without a new value arriving. Matches the canonical
 * `savepoint-app/shared/hooks/use-debounced-value.ts` shape (300ms default
 * per `desktop-command-palette.tsx`).
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);

  return debounced;
}
