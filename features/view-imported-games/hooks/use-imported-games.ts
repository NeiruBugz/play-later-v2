import { type Storefront } from "@prisma/client";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import axios from "axios";

type ImportedGame = {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
};

type ImportedGamesResponse = {
  games: ImportedGame[];
  totalGames: number;
  page: number;
  limit: number;
};

type UseImportedGamesParams = {
  page?: number;
  limit?: number;
  search?: string;
  storefront?: Storefront | "ALL";
  sortBy?: "name" | "playtime" | "storefront" | "createdAt";
  sortOrder?: "asc" | "desc";
};

const fetchImportedGames = async (
  params: UseImportedGamesParams
): Promise<ImportedGamesResponse> => {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set("page", params.page.toString());
  if (params.limit) searchParams.set("limit", params.limit.toString());
  if (params.search) searchParams.set("search", params.search);
  if (params.storefront && params.storefront !== "ALL") {
    searchParams.set("storefront", params.storefront);
  }
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const response = await axios.get<ImportedGamesResponse>(
    `/api/imported-games?${searchParams.toString()}`
  );

  return response.data;
};

export function useImportedGames(
  params: UseImportedGamesParams
): UseQueryResult<ImportedGamesResponse, Error> {
  return useQuery({
    queryKey: [
      "imported-games",
      params.page,
      params.limit,
      params.search,
      params.storefront,
      params.sortBy,
      params.sortOrder,
    ],
    queryFn: () => fetchImportedGames(params),
    staleTime: 30000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
  });
}

export type { ImportedGame, ImportedGamesResponse, UseImportedGamesParams };
