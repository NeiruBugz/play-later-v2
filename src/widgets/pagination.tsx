"use client";

import { Button } from "@/src/shared/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";


export function CollectionPagination({ size }: { size: number }) {
  const params = useSearchParams();
  const router = useRouter();

  const onPrevPage = useCallback(() => {
    const currentPage = params.get("page");
    if (currentPage === "1") return;

    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.set("page", String(Number(currentPage) - 1));
    router.replace(`/collection/?${paramsToUpdate.toString()}`);
  }, [params, router]);

  const onNextPage = useCallback(() => {
    const currentPage = params.get("page");

    const paramsToUpdate = new URLSearchParams(params);

    paramsToUpdate.set("page", String(Number(currentPage) + 1));
    router.replace(`/collection/?${paramsToUpdate.toString()}`);
  }, [params, router]);

  return (
    <div className="flex items-center gap-1">
      <Button variant={"outline"} onClick={onPrevPage} disabled={params.get('page') === '1'}><ChevronLeft/></Button>
      <Button variant="outline">{params.get('page') ?? 1}</Button>
      <Button variant={"outline"} onClick={onNextPage}><ChevronRight/></Button>
    </div>
  );
}