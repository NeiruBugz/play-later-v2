"use client";

import { useState } from "react";

import { useFetchSteamGames, useImportedGames } from "../hooks";
import {
  ImportedGamesList,
  type FilterValues,
  type SortBy,
} from "./imported-games-list";

export function ImportedGamesContainer() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterValues>({
    playtimeStatus: "all",
    playtimeRange: "all",
    platform: "all",
    lastPlayed: "all",
  });
  const [sortBy, setSortBy] = useState<SortBy>("playtime_desc");
  const [showAlreadyImported, setShowAlreadyImported] = useState(false);

  const { games, pagination, isLoading, isError, error, refetch } =
    useImportedGames({
      page,
      limit: 25,
      search,
      playtimeStatus: filters.playtimeStatus,
      playtimeRange: filters.playtimeRange,
      platform: filters.platform,
      lastPlayed: filters.lastPlayed,
      sortBy,
      showAlreadyImported,
    });

  const { mutate: syncSteamGames, isPending: isSyncing } = useFetchSteamGames();

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleSortChange = (newSortBy: SortBy) => {
    setSortBy(newSortBy);
    setPage(1);
  };

  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    setPage(1);
  };

  const handleShowAlreadyImportedChange = (show: boolean) => {
    setShowAlreadyImported(show);
    setPage(1);
  };

  return (
    <ImportedGamesList
      games={games}
      totalCount={pagination.total}
      currentPage={pagination.page}
      pageSize={pagination.limit}
      isLoading={isLoading || isSyncing}
      error={isError ? error : null}
      onPageChange={setPage}
      onRetry={refetch}
      onSync={() => syncSteamGames()}
      isSyncing={isSyncing}
      search={search}
      onSearchChange={handleSearchChange}
      playtimeStatus={filters.playtimeStatus}
      playtimeRange={filters.playtimeRange}
      platform={filters.platform}
      lastPlayed={filters.lastPlayed}
      sortBy={sortBy}
      showAlreadyImported={showAlreadyImported}
      onFilterChange={handleFilterChange}
      onSortChange={handleSortChange}
      onShowAlreadyImportedChange={handleShowAlreadyImportedChange}
    />
  );
}
