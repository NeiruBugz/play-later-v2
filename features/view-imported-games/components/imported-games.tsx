"use client";

import { Storefront } from "@prisma/client";
import { useState, useTransition } from "react";

import { Button } from "@/shared/components/button";
import { Card, CardContent, CardHeader } from "@/shared/components/card";
import { Skeleton } from "@/shared/components/skeleton";
import { Heading } from "@/shared/components/typography";

import { getImportedGames } from "../server-actions/get-imported-games";
import { ImportedGameCard } from "./imported-game-card";

interface ImportedGame {
  id: string;
  name: string;
  storefront: Storefront;
  storefrontGameId: string | null;
  playtime: number | null;
  img_icon_url: string | null;
  img_logo_url: string | null;
}

interface ImportedGamesProps {
  initialGames: ImportedGame[];
  initialTotalGames: number;
  initialPage?: number;
  limit?: number;
}

function ImportedGamesSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i} className="h-full overflow-hidden">
          <div className="aspect-[16/9]">
            <Skeleton className="h-full w-full" />
          </div>
          <CardHeader className="p-3 pb-2">
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ImportedGames({
  initialGames,
  initialTotalGames,
  initialPage = 1,
  limit = 20,
}: ImportedGamesProps) {
  const [games, setGames] = useState(initialGames);
  const [totalGames, setTotalGames] = useState(initialTotalGames);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.ceil(totalGames / limit);

  const loadPage = async (page: number) => {
    startTransition(async () => {
      try {
        const result = await getImportedGames({ page, limit });
        if (result?.data) {
          setGames(result.data.games);
          setTotalGames(result.data.totalGames);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error("Failed to load imported games:", error);
      }
    });
  };

  if (games.length === 0 && !isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 text-6xl">📦</div>
        <Heading level={2} className="mb-2">
          No imported games found
        </Heading>
        <p className="text-muted-foreground">
          Connect your gaming accounts to import your library
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1} className="mb-1">
            Imported Games
          </Heading>
          <p className="text-muted-foreground">
            {totalGames} game{totalGames !== 1 ? "s" : ""} imported from
            connected services
          </p>
        </div>
      </div>

      {/* Games Grid */}
      {isPending ? (
        <ImportedGamesSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {games.map((game) => (
            <ImportedGameCard key={game.id} game={game} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(currentPage - 1)}
            disabled={currentPage <= 1 || isPending}
          >
            Previous
          </Button>

          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => loadPage(pageNum)}
                  disabled={isPending}
                  className="w-8"
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadPage(currentPage + 1)}
            disabled={currentPage >= totalPages || isPending}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
