"use client";

import { Download, Plus, RefreshCw } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Link from "next/link";

import { getImportedGamesCount } from "@/features/dashboard/server-actions/get-imported-games-count";
import { Button } from "@/shared/components/button";
import { cn } from "@/shared/lib";

export function CollectionActions() {
  const {
    execute: getCount,
    result,
    isExecuting,
  } = useAction(getImportedGamesCount);

  const importedCount = result?.data?.count ?? 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <Link href="/collection/add-game">
          <Plus className="mr-2 h-4 w-4" />
          Add Game
        </Link>
      </Button>

      {importedCount > 0 && (
        <Button variant="outline" asChild>
          <Link href="/collection/imported">
            <Download className="mr-2 h-4 w-4" />
            Imported ({importedCount})
          </Link>
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => getCount()}
        disabled={isExecuting}
        className={cn(
          "text-muted-foreground hover:text-foreground",
          isExecuting && "opacity-50"
        )}
      >
        <RefreshCw className={cn("h-4 w-4", isExecuting && "animate-spin")} />
        <span className="sr-only">Refresh imported games count</span>
      </Button>
    </div>
  );
}
