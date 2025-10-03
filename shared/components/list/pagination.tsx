"use client";

import {
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/shared/components/ui/button";

type PaginationProps = {
  total: number;
  pageSize?: number;
  paramKey?: string;
  basePath?: string;
};

export function Pagination({
  total,
  pageSize = 24,
  paramKey = "page",
  basePath,
}: PaginationProps) {
  const router = useRouter();
  const params = useSearchParams();
  const pathname = usePathname();

  const currentPage = Number(params.get(paramKey)) || 1;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const path = basePath ?? pathname ?? "/";

  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const updatePage = (page: number) => {
    const next = new URLSearchParams(params?.toString());
    next.set(paramKey, String(page));
    router.replace(`${path}?${next.toString()}`);
  };

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    if (totalPages <= maxButtons) return pages;
    if (currentPage <= 3) return pages.slice(0, maxButtons);
    if (currentPage >= totalPages - 2)
      return pages.slice(totalPages - maxButtons);
    return pages.slice(currentPage - 3, currentPage + 2);
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => updatePage(1)}
        disabled={!canPrev}
      >
        <ChevronFirst className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => updatePage(currentPage - 1)}
        disabled={!canPrev}
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((p) => (
          <Button
            key={p}
            variant={p === currentPage ? "default" : "outline"}
            size="sm"
            className="w-8"
            onClick={() => updatePage(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => updatePage(currentPage + 1)}
        disabled={!canNext}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={() => updatePage(totalPages)}
        disabled={!canNext}
      >
        <ChevronLast className="size-4" />
      </Button>
    </div>
  );
}

