"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Input } from "@/shared/components/ui/input";
import {
  MIN_SEARCH_QUERY_LENGTH,
  SEARCH_INPUT_DEBOUNCE_MS,
} from "@/shared/constants";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";

import type { GameSearchInputProps } from "./game-search-input.types";

const GameSearchResults = dynamic(
  () => import("./game-search-results").then((mod) => mod.GameSearchResults),
  { ssr: false }
);

export const GameSearchInput = ({
  initialQuery = "",
  userId,
}: GameSearchInputProps) => {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, SEARCH_INPUT_DEBOUNCE_MS);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) {
      params.set("q", debouncedQuery);
    }
    const search = params.toString();
    const url = search ? `/games/search?${search}` : "/games/search";
    router.replace(url, { scroll: false });
  }, [debouncedQuery, router]);

  return (
    <div className="space-y-3xl">
      <Input
        type="search"
        placeholder="Search for games (minimum 3 characters)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search for games by name"
        className="body-md h-12"
      />
      {debouncedQuery.length >= MIN_SEARCH_QUERY_LENGTH && (
        <GameSearchResults query={debouncedQuery} userId={userId} />
      )}
    </div>
  );
};
