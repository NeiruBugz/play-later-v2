export interface SearchGamesInputProps {
  /** Initial value, read from the URL search param `q` by the parent route. */
  initialQuery: string;
  /**
   * Debounce window applied to URL updates. Exposed so tests can pass `0`
   * and skip fake timers; defaults to the canonical 300ms.
   */
  debounceMs?: number;
}
