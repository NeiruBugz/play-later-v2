import { useEffect, useRef, useState } from "react";

import { searchGamesFn } from "@/entities/game";
import type { SearchResponseItem } from "@/shared/api/igdb";

interface UseDebouncedGameSearchOptions {
  isOpen: boolean;
  debounceMs?: number;
  minQueryLength?: number;
}

interface UseDebouncedGameSearchResult {
  query: string;
  setQuery: (next: string) => void;
  results: SearchResponseItem[];
  isLoading: boolean;
  error: Error | null;
  shouldSearch: boolean;
}

/**
 * Owns debounced game search lifecycle: query state, timer ref, request-sequence
 * guard, results/isLoading/error state, and reset-on-close behaviour.
 *
 * WHY the timer is imperative: `setQuery` schedules the fetch directly in the
 * setTimeout callback — no React render cycle between the input change and the
 * fetch. This makes the debounce assertable via synchronous
 * `vi.advanceTimersByTime(300)` without waiting for a re-render
 * (test contract: command-palette.test.tsx scenario 2).
 */
export function useDebouncedGameSearch({
  isOpen,
  debounceMs = 300,
  minQueryLength = 1,
}: UseDebouncedGameSearchOptions): UseDebouncedGameSearchResult {
  const [query, setQueryState] = useState("");
  const [results, setResults] = useState<SearchResponseItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeqRef = useRef(0);

  // Reset state when the palette closes so the next open starts fresh.
  useEffect(() => {
    if (!isOpen) {
      setQueryState("");
      setResults([]);
      setError(null);
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    }
  }, [isOpen]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const setQuery = (nextQuery: string) => {
    setQueryState(nextQuery);

    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    if (nextQuery.length < minQueryLength) {
      setResults([]);
      setError(null);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null;
      const seq = ++requestSeqRef.current;
      setIsLoading(true);
      setError(null);
      searchGamesFn({ data: { name: nextQuery } })
        .then((result) => {
          if (seq !== requestSeqRef.current) return;
          setResults(result?.games ?? []);
        })
        .catch((cause: unknown) => {
          if (seq !== requestSeqRef.current) return;
          setError(cause instanceof Error ? cause : new Error(String(cause)));
          setResults([]);
        })
        .finally(() => {
          if (seq !== requestSeqRef.current) return;
          setIsLoading(false);
        });
    }, debounceMs);
  };

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    shouldSearch: query.length >= minQueryLength,
  };
}
