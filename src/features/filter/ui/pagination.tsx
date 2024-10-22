"use client";

import { Button } from "@/src/shared/ui";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
    <div className="flex items-center gap-1 text-xs">
      <Button
        variant="ghost"
        onClick={onGoToFirst}
        className="h-6 w-6 p-0"
        disabled={currentPage === 1}
      >
        <ChevronsLeft className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        disabled={!currentPage || currentPage === 1}
        onClick={() => onPageChange("prev")}
        className="h-6 w-6 p-0"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <span className="font-medium">
        {currentPage ?? 1} | {totalPages}
      </span>

      <Button
        variant="ghost"
        onClick={() => onPageChange("next")}
        disabled={currentPage >= totalPages}
        className="h-6 w-6 p-0"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
      <Button
        variant="ghost"
        onClick={onGoToLast}
        className="h-6 w-6 p-0"
        disabled={currentPage >= totalPages}
      >
        <ChevronsRight className="h-5 w-5" />
      </Button>
      <span>Total games: {totalCount}</span>
    </div>
  );
}
