"use client";

import { Button } from "@/src/shared/ui";
import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function Pagination({ totalCount }: { totalCount: number }) {
  const params = useSearchParams();
  const router = useRouter();

  const currentPage = Number(params.get("page")) || 1;
  const totalPages = Math.ceil(totalCount / 24);

  const onPageChange = useCallback(
    (direction: "prev" | "next") => {
      const page = Number(currentPage) ?? 1;
      const paramsToUpdate = new URLSearchParams(params);

      if (direction === "prev") {
        paramsToUpdate.set("page", Math.max(page - 1, 1).toString());
      } else if (direction === "next" && page < totalPages) {
        paramsToUpdate.set("page", (page + 1).toString());
      }

      router.replace(`/collection?${paramsToUpdate.toString()}`);
    },
    [currentPage, params, router, totalPages]
  );

  const onGoToFirst = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);
    paramsToUpdate.set("page", "1");
    router.replace(`/collection?${paramsToUpdate.toString()}`);
  }, [params, router]);

  const onGoToLast = useCallback(() => {
    const paramsToUpdate = new URLSearchParams(params);
    paramsToUpdate.set("page", totalPages.toString());
    router.replace(`/collection?${paramsToUpdate.toString()}`);
  }, [params, router, totalPages]);

  return (
    <div className="flex w-full items-center justify-between">
      <p className="text-sm text-muted-foreground">Total games: {totalCount}</p>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={onGoToFirst}
          disabled={currentPage === 1}
        >
          <ChevronFirst className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          disabled={!currentPage || currentPage === 1}
          onClick={() => onPageChange("prev")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="text-sm font-medium">
          {currentPage ?? 1} | {totalPages}
        </span>

        <Button
          variant="outline"
          size="icon"
          onClick={() => onPageChange("next")}
          disabled={currentPage >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onGoToLast}
          disabled={currentPage >= totalPages}
        >
          <ChevronLast className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
